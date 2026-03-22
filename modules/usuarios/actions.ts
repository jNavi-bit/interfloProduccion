"use server";

import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { createServiceRoleClient, hasServiceRoleKey } from "@/database/utils/supabase/admin";
import { getUserProfile } from "@/modules/dashboard/queries";
import type { UserRole } from "@/modules/dashboard/types";
import type { PlantaValue } from "@/modules/dashboard/plants";

export type UsuarioAdminRow = {
  id: string;
  name: string;
  role: string;
  planta: string | null;
  email: string | null;
  must_change_password: boolean;
};

async function requireAdminProfile() {
  const user = await getUserProfile();
  if (!user || user.role !== "admin") {
    return { ok: false as const, error: "Solo administradores pueden gestionar usuarios." };
  }
  return { ok: true as const, user };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listUsuariosAdmin(): Promise<
  { ok: true; rows: UsuarioAdminRow[] } | { ok: false; error: string }
> {
  const auth = await requireAdminProfile();
  if (!auth.ok) return auth;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, name, role, planta, email, must_change_password")
    .order("name", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, rows: (data as UsuarioAdminRow[]) ?? [] };
}

export async function updateUsuarioAdmin(input: {
  id: string;
  name: string;
  role: UserRole;
  planta: PlantaValue;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdminProfile();
  if (!auth.ok) return auth;

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "El nombre no puede quedar vacío." };
  }

  if (input.role !== "admin" && input.role !== "capturista") {
    return { ok: false, error: "Rol no válido." };
  }

  const validPlanta = ["llave2", "periferico", "perisur"].includes(input.planta);
  if (!validPlanta) {
    return { ok: false, error: "Planta no válida." };
  }

  if (input.id === auth.user.id && input.role !== "admin") {
    return {
      ok: false,
      error: "No puedes quitarte el rol de administrador a ti mismo.",
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("usuarios")
    .update({
      name,
      role: input.role,
      planta: input.planta,
    })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function createUsuarioAdmin(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  planta: PlantaValue;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireAdminProfile();
  if (!auth.ok) return auth;

  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "Alta de usuarios requiere SUPABASE_SERVICE_ROLE_KEY en variables de entorno del servidor (Project Settings → API → service_role).",
    };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) {
    return { ok: false, error: "El nombre es obligatorio." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Correo electrónico no válido." };
  }
  if (input.password.length < 8) {
    return { ok: false, error: "La contraseña temporal debe tener al menos 8 caracteres." };
  }
  if (input.role !== "admin" && input.role !== "capturista") {
    return { ok: false, error: "Rol no válido." };
  }
  if (!["llave2", "periferico", "perisur"].includes(input.planta)) {
    return { ok: false, error: "Planta no válida." };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de configuración del servidor." };
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createErr || !created.user) {
    return {
      ok: false,
      error: createErr?.message ?? "No se pudo crear el usuario en Auth.",
    };
  }

  const userId = created.user.id;

  const { error: upErr } = await admin.from("usuarios").upsert(
    {
      id: userId,
      name,
      email,
      role: input.role,
      planta: input.planta,
      must_change_password: true,
    },
    { onConflict: "id" }
  );

  if (upErr) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: upErr.message };
  }

  return { ok: true, id: userId };
}

const DELETE_CONFIRM = "ELIMINAR";

export async function deleteUsuarioAdmin(
  id: string,
  confirmacion: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdminProfile();
  if (!auth.ok) return auth;

  if (confirmacion.trim() !== DELETE_CONFIRM) {
    return { ok: false, error: `Escribe exactamente ${DELETE_CONFIRM} para confirmar.` };
  }
  if (id === auth.user.id) {
    return { ok: false, error: "No puedes eliminar tu propio usuario." };
  }

  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "Eliminar usuarios requiere SUPABASE_SERVICE_ROLE_KEY en el servidor.",
    };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de configuración." };
  }

  const { error: dbErr } = await admin.from("usuarios").delete().eq("id", id);
  if (dbErr) {
    return { ok: false, error: dbErr.message };
  }

  const { error: authErr } = await admin.auth.admin.deleteUser(id);
  if (authErr) {
    return { ok: false, error: authErr.message };
  }

  return { ok: true };
}
