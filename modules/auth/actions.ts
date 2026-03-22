"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { createServiceRoleClient, hasServiceRoleKey } from "@/database/utils/supabase/admin";
import { getUserProfile } from "@/modules/dashboard/queries";

export type SignInResult = { success: false; error: string } | { success: true };

/**
 * Server Action: inicia sesión (CUD — crea/actualiza la sesión en el servidor).
 * Solo para mutaciones; no usar para lecturas.
 */
export async function signIn(formData: FormData): Promise<SignInResult> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || !email.trim()) {
    return { success: false, error: "El correo es obligatorio." };
  }
  if (typeof password !== "string" || !password) {
    return { success: false, error: "La contraseña es obligatoria." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return {
      success: false,
      error:
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message,
    };
  }

  const uid = signInData.user?.id;
  if (uid) {
    const { data: row } = await supabase
      .from("usuarios")
      .select("must_change_password")
      .eq("id", uid)
      .maybeSingle();

    const must = (row as { must_change_password?: boolean | null } | null)?.must_change_password;
    if (must === true) {
      redirect("/dashboard/cambiar-contrasena");
    }
  }

  redirect("/dashboard");
}

export type CompletePasswordChangeResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Tras login con contraseña temporal: define la nueva contraseña y quita la obligación de cambio.
 */
export async function completeMandatoryPasswordChange(
  password: string,
  confirm: string
): Promise<CompletePasswordChangeResult> {
  if (password !== confirm) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }
  if (password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const profile = await getUserProfile();
  if (!profile) {
    return { ok: false, error: "No hay sesión activa." };
  }
  if (!profile.mustChangePassword) {
    return { ok: false, error: "No tienes pendiente un cambio de contraseña obligatorio." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error: pwErr } = await supabase.auth.updateUser({ password });
  if (pwErr) {
    return { ok: false, error: pwErr.message };
  }

  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      error:
        "El servidor no tiene SUPABASE_SERVICE_ROLE_KEY; un administrador debe configurarla para finalizar el cambio.",
    };
  }

  try {
    const admin = createServiceRoleClient();
    const { error: uErr } = await admin
      .from("usuarios")
      .update({ must_change_password: false })
      .eq("id", profile.id);
    if (uErr) {
      return { ok: false, error: uErr.message };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar el perfil." };
  }

  redirect("/dashboard");
}

/**
 * Server Action: cierra la sesión (CUD) y redirige a la landing.
 */
export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/");
}
