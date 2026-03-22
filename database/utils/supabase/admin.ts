import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

/**
 * Cliente Supabase con service role. Solo en Server Actions / Route Handlers.
 * Requiere `SUPABASE_SERVICE_ROLE_KEY` (nunca exponer al cliente).
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof key !== "string" || key.length === 0) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en variables de entorno del servidor (p. ej. .env.local)."
    );
  }
  return createClient(getSupabaseUrl(), key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return typeof key === "string" && key.length > 0;
}
