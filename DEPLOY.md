# Deploy en Vercel

## 1. Conectar el repositorio

1. Entra en [vercel.com](https://vercel.com) e inicia sesión.
2. **Add New** → **Project**.
3. Importa el repositorio de Git (GitHub, GitLab o Bitbucket).
4. Vercel detectará Next.js; no cambies el framework.

## 2. Variables de entorno

En **Project → Settings → Environment Variables** añade:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto (ej. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Clave pública/anon (ej. `sb_publishable_...`) |

Valores en Supabase: **Dashboard → Project Settings → API**.

Márcalas para **Production**, **Preview** y **Development** si quieres que apliquen en todos los entornos.

## 3. Deploy

- **Deploy** se lanza al hacer push a la rama conectada (p. ej. `main`).
- Cada push genera un nuevo deploy; los previews usan la misma configuración por defecto.

## 4. Comandos (por defecto)

- **Build:** `npm run build`
- **Output:** salida estándar de Next.js (no hace falta configurar `output` en `vercel.json`)

Si algo falla en el build, revisa los logs en Vercel y que las variables de entorno estén bien definidas.

## 5. Si ves "Internal Server Error" en la página

1. **Variables de entorno:** Comprueba que en Vercel (**Settings → Environment Variables**) existan exactamente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   No uses otros nombres (p. ej. `NEXT_PUBLIC_SUPABASE_ANON_KEY` no vale).

2. **Redeploy:** Si añadiste o cambiaste variables después del primer deploy, haz un nuevo deploy (Deployments → ⋮ → Redeploy) para que se apliquen.

3. **Logs:** En Vercel, **Deployments → función o deployment → Logs** verás el mensaje real (p. ej. "Missing or invalid env: ...").

4. La app muestra una página de error con estas instrucciones cuando detecta que faltan las variables.
