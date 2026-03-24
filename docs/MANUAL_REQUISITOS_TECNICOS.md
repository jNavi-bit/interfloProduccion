# Manual de requisitos técnicos — Interflo Producción

Documento orientado a **administradores de sistemas**, **DevOps** y **desarrolladores** que deben instalar, configurar o auditar el entorno necesario para que la aplicación funcione de forma correcta y segura.

---

## 1. Resumen del sistema

La aplicación es un **panel web** construido con **Next.js (App Router)** que se comunica con **Supabase** (PostgreSQL + autenticación) y, de forma opcional pero recomendada en producción, con la **API de OpenAI** para extracción asistida de datos desde imágenes de reportes (Captura y Entrega PT).

| Componente        | Rol |
|-------------------|-----|
| Navegador         | Cliente UI (React 19) |
| Servidor Node.js  | Next.js: páginas, Server Actions, API Routes |
| Supabase          | Base de datos, Auth, políticas RLS |
| OpenAI            | Visión / texto para rutas `/api/chat` y `/api/entrega-pt-chat` |

---

## 2. Stack tecnológico (versiones del proyecto)

Valores tomados de `package.json` en el repositorio; conviene **fijar las mismas major/minor** en despliegue.

| Tecnología        | Versión en proyecto |
|-------------------|---------------------|
| Next.js           | 16.1.6 |
| React / React DOM | 19.2.3 |
| TypeScript        | 5.x |
| Tailwind CSS      | 4.x |
| Supabase JS       | `@supabase/supabase-js` ^2.96, `@supabase/ssr` ^0.8 |
| HeroUI            | `@heroui/react` ^2.8 |
| OpenAI SDK        | `openai` ^6.32 |

**Compilador React:** el proyecto tiene activado **React Compiler** (`next.config.ts`).

**Server Actions:** límite de cuerpo ampliado a **10 MB** (`experimental.serverActions.bodySizeLimit`), relevante si se suben imágenes o payloads grandes por acciones de servidor.

---

## 3. Requisitos del entorno de ejecución (servidor / CI)

### 3.1 Node.js

- **Recomendado:** **Node.js 20 LTS** o **22 LTS** (alineado con el ecosistema Next.js 16).
- **Gestor de paquetes:** `npm` (el repo define scripts estándar); alternativamente `pnpm` o `yarn` si se unifica en el equipo.

### 3.2 Sistema operativo

- Cualquier SO donde Node.js sea soportado de forma oficial (Windows Server, Linux, macOS).
- En **Linux**, instancias típicas: Ubuntu 22.04/24.04 LTS u otras con glibc reciente.

### 3.3 Recursos orientativos

Los valores dependen del tráfico; como referencia mínima para un despliegue pequeño:

- **RAM:** 512 MB–1 GB para el proceso Node (más si hay muchas conexiones concurrentes).
- **CPU:** 1 vCPU puede bastar en entornos de baja carga; escalar según métricas.
- **Disco:** espacio para artefactos de build (`.next`) y logs; el almacenamiento principal de datos está en **Supabase**.

### 3.4 Red

- **Salida HTTPS** hacia:
  - Host de Supabase (`NEXT_PUBLIC_SUPABASE_URL`).
  - `api.openai.com` (si se usan las rutas de chat con imagen).
- **Entrada:** puerto configurado para Next.js (por defecto **3000** en desarrollo; en producción suele ir detrás de un proxy TLS).

### 3.5 Navegadores (cliente)

- Navegadores **modernos** con JavaScript habilitado y soporte para **cookies** (sesión Supabase).
- En producción, el sitio debe servirse por **HTTPS** para cookies `Secure` y buenas prácticas de Auth.

---

## 4. Variables de entorno

### 4.1 Obligatorias para el núcleo (Supabase)

Sin estas variables, el cliente y el middleware no pueden inicializar Supabase correctamente (la app puede fallar al usar auth o datos).

| Variable | Ámbito | Descripción |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + servidor | URL del proyecto Supabase (p. ej. `https://xxxx.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Cliente + servidor | Clave pública (anon / publishable) de Supabase. |

Definición y validación en: `database/utils/supabase/env.ts`.

### 4.2 Obligatorias para operaciones administrativas del servidor

| Variable | Ámbito | Descripción |
|----------|--------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** | Clave con privilegios elevados. **No** debe exponerse al navegador ni incluirse en bundles cliente. |

**Uso en el código:** creación del cliente admin en `database/utils/supabase/admin.ts`. Se emplea, entre otros, en:

- Flujo de **cambio de contraseña obligatorio** tras login (`modules/auth/actions.ts`): sin esta clave, el usuario puede quedar bloqueado al intentar completar el cambio.
- **Administración de usuarios** (`modules/usuarios/actions.ts`): operaciones que requieren bypass de RLS o gestión avanzada.

Si falta en entornos donde no se usan esas funciones, parte de la app puede seguir operativa, pero las funciones anteriores **fallarán de forma explícita**.

### 4.3 Opcional / condicional (OpenAI)

| Variable | Ámbito | Descripción |
|----------|--------|-------------|
| `OPENAI_API_KEY` | Solo servidor | API key de OpenAI para `/api/chat` y `/api/entrega-pt-chat`. |

Si no está definida, esas rutas responden con error indicando que falta la clave; el resto del dashboard puede seguir funcionando si no se invoca la subida inteligente de reportes por imagen.

**Modelo usado en código:** `gpt-4.1-mini` (API Responses con entrada de imagen y texto). Debe estar **habilitado** en la cuenta/API de OpenAI utilizada.

### 4.4 Archivos locales

- En desarrollo, suele usarse **`.env.local`** (no versionar en Git).
- En la nube (p. ej. Vercel): **Project → Settings → Environment Variables**, replicando los mismos nombres.

---

## 5. Base de datos y Supabase

### 5.1 Motor

- **PostgreSQL** gestionado por el proyecto Supabase vinculado a la URL y claves anteriores.

### 5.2 Esquema y migraciones

- Las definiciones versionadas del esquema, políticas **RLS**, funciones y datos iniciales están en **`supabase/migrations/`** (SQL).
- Para un entorno nuevo es necesario **aplicar esas migraciones** al proyecto Supabase (CLI de Supabase, SQL editor, o pipeline acordado por el equipo).

### 5.3 Autenticación

- **Supabase Auth** (email/contraseña según configuración del proyecto).
- La aplicación sincroniza sesión mediante cookies en middleware (`database/utils/supabase/middleware.ts`, invocado desde `proxy.ts`).

### 5.4 Seguridad

- Las tablas sensibles deben protegerse con **RLS** acorde a las migraciones del repositorio.
- La **service role** solo en servidor; rotar la clave si se filtra.

---

## 6. Servicios externos

| Servicio | Propósito | Requisito |
|----------|-----------|-----------|
| **Supabase** | DB + Auth | Proyecto activo, migraciones aplicadas, URL y keys configuradas. |
| **OpenAI** | OCR / extracción desde imagen (Captura y Entrega PT) | Cuenta con facturación/cuota; `OPENAI_API_KEY`; modelo disponible. |

No hay en el código revisado otras integraciones obligatorias (SMS, pago, etc.) para el funcionamiento básico.

---

## 7. Comandos operativos

```bash
# Instalar dependencias
npm install

# Desarrollo (servidor de desarrollo Next.js)
npm run dev

# Compilación de producción
npm run build

# Arranque en producción (tras build)
npm run start

# Lint
npm run lint
```

**Verificación de tipos (recomendado en CI):**

```bash
npx tsc --noEmit
```

---

## 8. Despliegue

- **Plataforma típica:** cualquier host que ejecute Node y permita variables de entorno (Vercel, Railway, Docker propio, etc.).
- Asegurar que todas las variables de la sección 4 estén definidas en el entorno de **producción**.
- Configurar **dominio y HTTPS** para cookies de sesión.
- Si el proveedor impone límites de tamaño de body en Server Actions o en el proxy inverso, tener en cuenta el límite de **10 MB** ya configurado en Next; el proxy (nginx, etc.) debe permitir al menos ese orden de magnitud para rutas que lo necesiten.

---

## 9. Checklist rápido antes de dar por válido un entorno

- [ ] Node.js 20+ (o 22 LTS) instalado.
- [ ] `npm install` y `npm run build` sin errores.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` definidas.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` definida en servidor si se usa administración de usuarios o cambio de contraseña obligatorio.
- [ ] Migraciones SQL aplicadas en Supabase.
- [ ] `OPENAI_API_KEY` definida si se requiere subida/análisis de reportes por imagen.
- [ ] HTTPS en producción y salida a Internet hacia Supabase y OpenAI.

---

## 10. Mantenimiento del documento

Al actualizar dependencias mayores (Next, Supabase SDK, modelo de OpenAI) o añadir nuevas variables de entorno, conviene **revisar este manual** y el código en `database/utils/supabase/` y `app/api/` para mantener la tabla de variables y el stack al día.

*Última revisión alineada con el repositorio: Next 16.1.6, React 19.2.3.*
