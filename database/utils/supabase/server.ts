import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export type CookieStore = Awaited<ReturnType<typeof cookies>>;

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export function createClient(cookieStore: CookieStore) {
  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options ?? {})
            );
          } catch {
            // Llamado desde un Server Component; puede ignorarse si el middleware refresca sesiones.
          }
        },
      },
    }
  );
}
