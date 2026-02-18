"use client";

/**
 * Captura errores en la raíz (p. ej. variables de entorno faltantes en Vercel).
 * En producción, el mensaje del error puede ser genérico; mostramos una guía de env. jvgh
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isEnvError =
    typeof error?.message === "string" &&
    (error.message.includes("Missing or invalid env") ||
      error.message.includes("NEXT_PUBLIC_SUPABASE"));

  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "480px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
          {isEnvError ? "Configuración requerida" : "Algo ha fallado"}
        </h1>
        {isEnvError ? (
          <p style={{ color: "#555", marginBottom: "1rem" }}>
            En Vercel, añade estas variables en <strong>Project → Settings → Environment Variables</strong>:
          </p>
        ) : (
          <p style={{ color: "#555", marginBottom: "1rem" }}>
            Si acabas de desplegar en Vercel, suele deberse a variables de entorno no configuradas.
          </p>
        )}
        <ul style={{ marginBottom: "1rem", paddingLeft: "1.25rem" }}>
          <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
          <li><code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code></li>
        </ul>
        <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Valores en Supabase: Dashboard → Project Settings → API. Después, redeploy en Vercel.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1rem",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
