/**
 * Validación de variables de entorno para Supabase.
 * No usar `any`; fallar en tiempo de ejecución si faltan.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/** Comprueba si las variables de Supabase están definidas (para no lanzar en proxy). */
export function hasSupabaseEnv(): boolean {
  return (
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.length > 0 &&
    typeof SUPABASE_PUBLISHABLE_KEY === "string" &&
    SUPABASE_PUBLISHABLE_KEY.length > 0
  );
}

function getEnv(
  name: string,
  value: string | undefined
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `Missing or invalid env: ${name}. In Vercel: Project → Settings → Environment Variables.`
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return getEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
}

export function getSupabasePublishableKey(): string {
  return getEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    SUPABASE_PUBLISHABLE_KEY
  );
}
