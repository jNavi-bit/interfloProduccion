"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";

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

  const { error } = await supabase.auth.signInWithPassword({
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
