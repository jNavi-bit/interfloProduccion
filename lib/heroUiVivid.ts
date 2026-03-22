/**
 * HeroUI: campos oscuros con borde azul vivo, hover violeta y brillo en focus.
 */
export const vividInputWrapper =
  "border border-sky-500/45 bg-slate-950/90 shadow-[0_0_24px_-10px_rgba(34,211,238,0.5)] backdrop-blur-sm transition-colors group-data-[hover=true]:border-fuchsia-400/50 group-data-[focus=true]:border-cyan-300 group-data-[focus=true]:shadow-[0_0_36px_-8px_rgba(192,38,211,0.45)]";

export const vividFieldClassNames = {
  inputWrapper: vividInputWrapper,
  label: "text-sky-200/90 font-medium",
} as const;

export const vividSelectClassNames = {
  trigger: vividInputWrapper,
  value: "text-slate-100",
  label: "text-sky-200/90 font-medium",
  listbox: "border border-fuchsia-500/35 bg-slate-950 shadow-2xl shadow-fuchsia-500/20",
  popoverContent: "border border-sky-500/30 bg-slate-950/95 backdrop-blur-md",
} as const;

export const vividDatePickerClassNames = {
  inputWrapper: vividInputWrapper,
  label: "text-sky-200/90 font-medium",
} as const;

export const vividPopoverContentClass =
  "border border-orange-500/35 bg-slate-950/95 shadow-2xl shadow-orange-500/15 backdrop-blur-md";
