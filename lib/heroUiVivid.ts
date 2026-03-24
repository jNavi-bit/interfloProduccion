/**
 * HeroUI: campos oscuros con borde azul vivo, hover/focus en tonos cian/sky.
 */
export const vividInputWrapper =
  "border border-sky-500/45 bg-slate-950/90 shadow-[0_0_24px_-10px_rgba(34,211,238,0.5)] backdrop-blur-sm transition-colors group-data-[hover=true]:border-sky-400/55 group-data-[focus=true]:border-cyan-300 group-data-[focus=true]:shadow-[0_0_28px_-8px_rgba(34,211,238,0.35)]";

export const vividFieldClassNames = {
  inputWrapper: vividInputWrapper,
  label: "text-sky-200/90 font-medium",
} as const;

/** Listbox del Select: sin borde fucsia; ítems planos y texto claro. */
export const vividSelectListboxProps = {
  variant: "flat" as const,
  color: "default" as const,
  className: "max-h-72 gap-0.5 p-1",
  itemClasses: {
    base: "min-h-9 rounded-md px-2 py-1.5 text-slate-100 data-[hover=true]:bg-sky-500/20 data-[selectable=true]:focus:bg-sky-500/25 data-[selected=true]:bg-sky-500/25",
    title: "text-[15px] font-medium text-slate-100",
    description: "text-slate-400",
  },
};

/** Evita la máscara de ScrollShadow que recorta u oscurece filas del desplegable. */
export const vividSelectScrollShadowProps = {
  isEnabled: false,
} as const;

export const vividSelectClassNames = {
  trigger: vividInputWrapper,
  value: "text-slate-100 data-[placeholder=true]:text-slate-500",
  label: "text-sky-200/90 font-medium",
  listbox: "gap-0.5 bg-transparent p-0 outline-none ring-0 shadow-none",
  popoverContent:
    "min-w-[12rem] border border-slate-600/50 bg-slate-900 p-1 shadow-2xl shadow-black/50",
  listboxWrapper: "overflow-y-auto p-0 !shadow-none !ring-0",
} as const;

export const vividDatePickerClassNames = {
  inputWrapper: vividInputWrapper,
  label: "text-sky-200/90 font-medium",
} as const;

export const vividPopoverContentClass =
  "border border-orange-500/35 bg-slate-950/95 shadow-2xl shadow-orange-500/15 backdrop-blur-md";
