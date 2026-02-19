import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: "amber" | "emerald" | "sky" | "violet";
}

const colorMap = {
  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  sky: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  violet: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
};

export function StatCard({ label, value, subtitle, icon, color }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
