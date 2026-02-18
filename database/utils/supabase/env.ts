/**
 * Validación de variables de entorno para Supabase.
 * No usar `any`; fallar en tiempo de ejecución si faltan.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

function getEnv(
  name: string,
  value: string | undefined
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `Missing or invalid env: ${name}. Add it to .env.local (see .env.example).`
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
