"use client";

import { useMemo } from "react";
import { chartScaleMax, type ProductividadBarChartItem } from "../productividadChartUtils";

type ProductividadBarChartProps = {
  items: ProductividadBarChartItem[];
  /** Título corto sobre el gráfico */
  title?: string;
  className?: string;
};

/**
 * Barras horizontales con gradiente (productividad % o kilos).
 */
export function ProductividadBarChart({
  items,
  title = "Eficiencia / productividad (visual)",
  className = "",
}: ProductividadBarChartProps) {
  const maxScale = useMemo(() => chartScaleMax(items), [items]);

  if (items.length === 0) {
    return null;
  }

  const unit = items[0]?.unit ?? "pct";
  const axisHint =
    unit === "pct"
      ? "Escala hasta el máximo entre 100% y el valor más alto (tope 200%)."
      : "Escala proporcional a kilos del periodo.";

  return (
    <div
      className={`rounded-xl border border-sky-500/25 bg-gradient-to-br from-[rgb(22_42_74_/_0.55)] to-slate-950/80 p-4 shadow-inner shadow-sky-900/20 sm:p-5 ${className}`}
    >
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="font-display text-sm font-semibold tracking-tight text-sky-100 sm:text-base">
          {title}
        </h3>
        <p className="text-[10px] text-slate-500 sm:text-xs">{axisHint}</p>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => {
          const wPct = Math.min(100, maxScale > 0 ? (item.value / maxScale) * 100 : 0);
          return (
            <div key={item.id} className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-[min(42%,11rem)] shrink-0 truncate text-left text-[11px] font-medium text-slate-300 sm:w-52 sm:text-xs"
                title={item.label}
              >
                {item.label}
              </div>
              <div className="min-w-0 flex-1">
                <div className="h-9 overflow-hidden rounded-lg bg-slate-900/90 ring-1 ring-white/10 sm:h-10">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-sky-600 via-cyan-500 to-orange-500 shadow-[0_0_20px_-6px_rgba(34,211,238,0.4)] transition-[width] duration-500 ease-out"
                    style={{ width: `${wPct}%` }}
                  />
                </div>
              </div>
              <div className="w-14 shrink-0 text-right text-[11px] font-semibold tabular-nums text-emerald-300 sm:w-16 sm:text-xs">
                {item.displayValue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
