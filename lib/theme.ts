/**
 * Clases Tailwind reutilizables (dashboard en modo .dark + tokens app/* en @theme).
 * Primario frío (cyan/sky); acento cálido: naranja (warning) para acciones especiales.
 */

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium text-main transition hover:bg-hl disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-mute transition hover:bg-hl hover:text-white disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed",
  success:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed",
  warm:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/35 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/20 disabled:opacity-50",
  export:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed",
  icon: "inline-flex items-center justify-center rounded-xl p-2 text-mute transition hover:bg-hl hover:text-white",
} as const;

export const txt = {
  h1: "font-display text-2xl font-bold tracking-tight text-white sm:text-3xl",
  h2: "text-xl font-semibold text-white",
  h3: "text-lg font-semibold text-white",
  subtitle: "text-sm text-slate-400",
  label: "text-sm font-medium text-slate-200",
  body: "text-sm text-slate-300",
} as const;

export const field = {
  input:
    "w-full rounded-xl border border-slate-600/60 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20",
  select:
    "w-full appearance-none rounded-xl border border-slate-600/60 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20",
  label: "mb-1.5 block text-sm font-medium text-slate-200",
} as const;

export const panel = {
  card: "rounded-2xl border border-white/[0.08] bg-slate-900/50 backdrop-blur-sm",
  section: "rounded-2xl border border-white/[0.08] bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6",
  inset: "rounded-xl border border-slate-700/50 bg-slate-950/60",
} as const;

export const banner = {
  info: "flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200",
  success: "flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300",
  warning: "flex items-center gap-2 rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm text-orange-200",
  error: "flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300",
} as const;

export const nav = {
  link: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
  active: "bg-sky-500/15 text-sky-300",
  inactive: "text-slate-400 hover:bg-white/5 hover:text-slate-200",
} as const;
