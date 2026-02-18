import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { LoginPage } from "@/modules/auth";

/**
 * Al entrar a /login se cierra la sesión (p. ej. al usar "atrás" desde el dashboard).
 * Siempre se muestra el formulario de login.
 */
export default async function LoginRoute() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();

  return <LoginPage />;
}
