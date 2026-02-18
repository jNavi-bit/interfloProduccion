import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { LandingPage } from "@/modules/landing";

/**
 * Lectura de sesión en el servidor para pasar a la landing (evita hidratación).
 */
export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage isLoggedIn={!!user} />;
}
