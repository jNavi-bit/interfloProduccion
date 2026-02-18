import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Crea el cliente de Supabase para el middleware y devuelve la respuesta
 * con las cookies de sesión actualizadas. Usar en el middleware raíz (p. ej. middleware.ts).
 */
export async function createMiddlewareClient(
  request: NextRequest
): Promise<NextResponse> {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? {});
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
