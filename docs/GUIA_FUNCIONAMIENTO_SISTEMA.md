# Guía de funcionamiento del sistema y especificación de requisitos (estilo IEEE 830-1998)

Este documento complementa el [Manual de requisitos técnicos](/manual/requisitos-tecnicos) (también en el repositorio como `docs/MANUAL_REQUISITOS_TECNICOS.md`) y describe el comportamiento observable de **Interflo Producción** desde la perspectiva de un **SRS** (*Software Requirements Specification*), siguiendo la estructura y el vocabulario del estándar **IEEE Std 830-1998**. No sustituye el contrato legal ni la certificación formal; sirve como **trazabilidad** entre necesidades, implementación en el repositorio y verificación funcional.

---

## 1. Introducción

### 1.1 Propósito

Definir y relacionar los **requisitos funcionales** (qué debe hacer el software) y **no funcionales** (cómo debe hacerlo: seguridad, rendimiento, entorno, etc.) con las **secciones operativas** de la aplicación, de forma que cualquier parte interesada pueda seguir el flujo paso a paso y contrastar el cumplimiento.

### 1.2 Alcance del software

**Interflo Producción** es una aplicación web para **captura**, **consulta** y **reporte** de datos de producción por **planta**, con **autenticación** centralizada, **panel administrativo** y opciones de **asistencia por visión artificial** sobre imágenes de reportes (cuando el entorno lo permite).

### 1.3 Definiciones y referencias

| Término | Significado |
|--------|-------------|
| RF | Requisito funcional |
| RNF | Requisito no funcional |
| RLS | Row Level Security (PostgreSQL / Supabase) |
| SRS | Especificación de requisitos de software |

**Referencia normativa:** IEEE Std 830-1998 — *IEEE Recommended Practice for Software Requirements Specifications*.

**Referencias del proyecto:** manual técnico en `docs/MANUAL_REQUISITOS_TECNICOS.md`, esquema en `supabase/migrations/`, rutas en `app/`, lógica en `modules/`.

---

## 2. Requisitos funcionales (RF)

Cada RF es **verificable**: existe una sección o flujo en la aplicación que lo materializa.

| ID | Enunciado | Evidencia / ubicación principal |
|----|-----------|----------------------------------|
| **RF-01** | El sistema debe ofrecer una **página de bienvenida pública** con acceso a login o al panel si ya hay sesión. | `app/page.tsx`, `modules/landing/components/LandingPage.tsx` |
| **RF-02** | El usuario debe **autenticarse** con credenciales gestionadas por Supabase Auth. | `app/login/page.tsx`, `modules/auth/`, cookies + middleware |
| **RF-03** | Tras autenticarse, el usuario autenticado debe acceder al **panel** (`/dashboard`) y rutas hijas según permisos. | `app/dashboard/**`, `getUserProfile`, redirecciones |
| **RF-04** | El sistema debe **cerrar sesión** de forma explícita. | `modules/auth/actions.ts` (`signOut`), `Sidebar` |
| **RF-05** | Debe existir flujo de **cambio de contraseña** cuando las políticas del negocio lo exijan (p. ej. primer acceso). | `app/dashboard/cambiar-contrasena/`, acciones de auth |
| **RF-06** | La vista de datos debe estar **acotada por planta**; los administradores pueden elegir planta; el resto de usuarios ve la **planta asignada**. | `modules/dashboard/plants.ts`, `Sidebar` (selector), `resolvePlantaForUser` |
| **RF-07** | El **inicio del panel** debe mostrar un **resumen** (indicadores y actividad reciente) según la planta activa. | `modules/dashboard/components/HomePage.tsx`, `getDashboardHomeData` |
| **RF-08** | Debe permitirse la **captura y edición** de registros de producción en formato tabular acorde al flujo de negocio (columnas definidas). | `app/dashboard/captura/`, `modules/captura/`, `plantConfig.ts` |
| **RF-09** | Debe permitirse el registro y consulta de **Entrega PT** con listado paginado o incremental según implementación. | `app/dashboard/entrega-pt/`, `modules/entregaPt/` |
| **RF-10** | Debe existir un **hub de reportes** con acceso a informes por **kilos**, **metros** y **productividad** filtrados por planta y periodo. | `app/dashboard/reportes/`, subrutas `kilos`, `metros`, `productividad` |
| **RF-11** | Debe mostrarse el **inventario / catálogo** de productos consultable desde el panel. | `app/dashboard/inventario/`, `modules/inventario/` |
| **RF-12** | Debe existir **configuración** de parámetros de aplicación visibles según rol (p. ej. administrador). | `app/dashboard/configuracion/`, `modules/configuracion/` |
| **RF-13** | Los **administradores** deben poder **administrar usuarios** (alta, roles o restricciones según implementación). | `app/dashboard/usuarios/`, `modules/usuarios/` |
| **RF-14** | De forma **opcional**, el sistema puede **extraer datos desde imagen** de reportes mediante API de servidor (Captura / Entrega PT) cuando `OPENAI_API_KEY` esté configurada. | `app/api/chat/`, `app/api/entrega-pt-chat/`, manual técnico §4.3 |
| **RF-15** | El sistema debe enlazar **documentación técnica** accesible sin autenticación (requisitos de instalación y entorno). | `app/manual/requisitos-tecnicos/`, `docs/MANUAL_REQUISITOS_TECNICOS.md` |

---

## 3. Requisitos no funcionales (RNF)

Incluyen lo ya plasmado en el manual técnico y **atributos de calidad** típicos de IEEE 830.

### 3.1 Entorno y despliegue (del manual técnico)

| ID | Enunciado | Fuente en proyecto |
|----|-----------|---------------------|
| **RNF-01** | El servidor de aplicación debe ejecutarse en **Node.js** compatible con Next.js 16 (p. ej. 20 LTS o 22 LTS). | Manual §3.1, `package.json` |
| **RNF-02** | La aplicación debe poder desplegarse en SO soportados por Node y exponerse detrás de **HTTPS** en producción para cookies de sesión. | Manual §3.2, §3.4, §8 |
| **RNF-03** | Debe documentarse y configurarse el **tamaño máximo** de cuerpo en Server Actions (orden de **10 MB**) y coherencia con el proxy inverso. | Manual §2, §8; `next.config` |
| **RNF-04** | Variables **obligatorias** para núcleo: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`. | Manual §4.1, `database/utils/supabase/env.ts` |
| **RNF-05** | Operaciones elevadas (admin usuarios, cambio de contraseña forzado) requieren `SUPABASE_SERVICE_ROLE_KEY` **solo en servidor**. | Manual §4.2 |
| **RNF-06** | Integración OpenAI es **opcional**; sin `OPENAI_API_KEY`, las rutas de visión responden error controlado y el resto del panel puede operar. | Manual §4.3 |
| **RNF-07** | Persistencia en **PostgreSQL** vía Supabase; esquema y **RLS** versionados en migraciones. | Manual §5 |
| **RNF-08** | El cliente debe ser un **navegador moderno** con JavaScript y cookies habilitadas. | Manual §3.5 |

### 3.2 Seguridad, mantenibilidad y usabilidad (completado respecto al manual)

| ID | Enunciado | Evidencia / notas |
|----|-----------|-------------------|
| **RNF-09** | **Autenticación y sesión** deben mediarse por middleware que sincronice cookies con Supabase. | `database/utils/supabase/middleware.ts`, `proxy.ts` |
| **RNF-10** | **Separación de privilegios**: rol `admin` para gestión de usuarios y selector de planta completo; usuarios estándar limitados a su planta. | `Sidebar`, `modules/usuarios/` |
| **RNF-11** | **Confidencialidad**: claves de servicio y API no deben exponerse al bundle cliente. | Arquitectura Next.js (server-only), manual §4.2 |
| **RNF-12** | **Mantenibilidad**: dependencias y scripts documentados; tipado TypeScript; lint configurado. | `package.json`, `eslint.config.mjs` |
| **RNF-13** | **Usabilidad**: navegación lateral coherente, indicadores de planta activa, CTAs claros en landing y login. | `Sidebar`, `LandingPage`, `LoginPage` |
| **RNF-14** | **Accesibilidad razonable**: etiquetas `aria` y títulos en controles críticos (p. ej. cerrar sesión, listas). | Componentes del panel y landing |
| **RNF-15** | **Portabilidad del despliegue**: misma base de código desplegable en proveedores Node estándar (Vercel, Docker, etc.). | Manual §8, `DEPLOY.md` si aplica |

---

## 4. Funcionamiento paso a paso por sección y contraste de cumplimiento

En cada bloque: **pasos** para el usuario u operador, luego **requisitos satisfechos** (RF/RNF) que aplican de forma directa.

### 4.1 Landing pública (`/`)

1. Abrir el sitio: se muestra mensaje de valor, características y enlaces a anclas internas.
2. Usar **Acceder** / **Acceso**: si hay sesión válida → `dashboard`; si no → `login`.
3. Opcional: pie de página — manual de requisitos técnicos, políticas (anclas).

**Cumplimiento:** RF-01, RF-15; RNF-08, RNF-13.

---

### 4.2 Inicio de sesión (`/login`)

1. Introducir credenciales según Supabase Auth.
2. Tras éxito, el middleware mantiene la sesión por cookies.
3. Si aplica política de negocio, redirección a **cambiar contraseña**.

**Cumplimiento:** RF-02, RF-03, RF-05; RNF-09, RNF-04, RNF-08.

---

### 4.3 Panel — Inicio (`/dashboard`)

1. Ver saludo y **resumen** del último día con reportes y métricas agregadas.
2. Confirmar **planta** en el selector lateral (según rol).

**Cumplimiento:** RF-03, RF-06, RF-07; RNF-10, RNF-13.

---

### 4.4 Captura de producción (`/dashboard/captura`)

1. Asegurar **planta** correcta en la barra lateral.
2. Revisar o completar la **grilla** según columnas de negocio (SKU, máquina, cantidades, fechas, etc.).
3. Guardar o actualizar registros según las acciones disponibles en UI.
4. Opcional: adjuntar imagen de reporte para **asistencia por IA** si el entorno tiene `OPENAI_API_KEY`.

**Cumplimiento:** RF-08, RF-06, RF-14; RNF-03, RNF-06, RNF-07.

---

### 4.5 Entrega PT (`/dashboard/entrega-pt`)

1. Misma lógica de **planta** que en captura.
2. Consultar listado de entregas; cargar o editar según permisos de la UI.
3. Opcional: flujo de imagen + chat de extracción si está configurado.

**Cumplimiento:** RF-09, RF-06, RF-14; RNF-06, RNF-07.

---

### 4.6 Reportes (`/dashboard/reportes` y subrutas)

1. Elegir informe: **kilos**, **metros** o **productividad**.
2. Aplicar filtros de **fecha** / periodo indicados en cada pantalla.
3. Interpretar resultados agregados por máquina u otras dimensiones definidas.

**Cumplimiento:** RF-10, RF-06; RNF-07, RNF-13.

---

### 4.7 Inventario (`/dashboard/inventario`)

1. Consultar catálogo de productos y campos asociados (proyecto, cliente, existencias, etc., según esquema).

**Cumplimiento:** RF-11, RF-06; RNF-07.

---

### 4.8 Configuración (`/dashboard/configuracion`)

1. Ajustar parámetros expuestos en la interfaz; las capacidades **admin-only** dependen del rol.

**Cumplimiento:** RF-12, RF-03; RNF-10.

---

### 4.9 Administrar usuarios (`/dashboard/usuarios`) — solo administrador

1. Gestionar cuentas o roles según las acciones implementadas.
2. Requiere `SUPABASE_SERVICE_ROLE_KEY` en servidor para operaciones elevadas.

**Cumplimiento:** RF-13; RNF-05, RNF-10, RNF-11.

---

### 4.10 Cerrar sesión

1. Desde el pie del menú lateral, ejecutar **Cerrar sesión**.

**Cumplimiento:** RF-04; RNF-09, RNF-14.

---

## 5. Matriz de trazabilidad resumida (sección → RF)

| Sección | RF principales |
|---------|----------------|
| Landing | RF-01, RF-15 |
| Login / sesión | RF-02, RF-03, RF-05 |
| Dashboard inicio | RF-03, RF-06, RF-07 |
| Captura | RF-06, RF-08, RF-14 |
| Entrega PT | RF-06, RF-09, RF-14 |
| Reportes | RF-06, RF-10 |
| Inventario | RF-06, RF-11 |
| Configuración | RF-03, RF-12 |
| Usuarios | RF-13 |
| Logout | RF-04 |

---

## 6. Contraste explícito: funcionales vs no funcionales

| Aspecto | Tipo | Cómo se observa el cumplimiento |
|--------|------|-----------------------------------|
| “Puedo capturar producción por planta” | **Funcional (RF-06, RF-08)** | La UI carga datos filtrados por planta y persiste en tablas protegidas. |
| “Los datos están aislados por políticas” | **No funcional (RNF-07, RNF-10)** | RLS y roles en base de datos y aplicación. |
| “La app responde en navegador moderno” | **No funcional (RNF-08)** | Compatible con el stack documentado en el manual. |
| “Puedo desplegar en Node + HTTPS” | **No funcional (RNF-01, RNF-02)** | Cumplido si el entorno sigue el manual técnico. |
| “La extracción por imagen funciona” | **Funcional condicional (RF-14)** + **RNF-06** | Requiere clave OpenAI y modelo disponible; si no, fallo acotado sin tumbar el panel. |

---

## 7. Mantenimiento de esta guía

Al añadir módulos, rutas o variables de entorno, actualizar las tablas **RF/RNF** y los pasos de la sección 4 para conservar la trazabilidad con el estándar de práctica **IEEE 830-1998** y con el **manual técnico** del repositorio.

*Documento alineado con el código del repositorio Interflo Producción (Next.js App Router, Supabase, módulos en `app/` y `modules/`).*
