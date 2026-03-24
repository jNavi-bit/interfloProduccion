import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: "amber" | "emerald" | "sky" | "orange";
}

const colorMap = {
  amber: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/35",
  emerald: "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-700 text-white shadow-lg shadow-emerald-500/35",
  sky: "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 text-white shadow-lg shadow-sky-500/35",
  orange: "bg-gradient-to-br from-orange-400 via-amber-500 to-orange-700 text-white shadow-lg shadow-orange-500/35",
};

export function StatCard({ label, value, subtitle, icon, color }: StatCardProps) {
  return (
    <div className="gradient-ring-surface relative overflow-hidden rounded-2xl p-5 shadow-xl shadow-blue-950/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-orange-950/25">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/[0.07] via-transparent to-orange-600/[0.08]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-sky-200/80">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-2 ring-white/10 ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
