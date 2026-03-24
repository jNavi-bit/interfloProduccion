import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { resolvePlantaForUser } from "@/modules/dashboard/plants";
import { InstantLastDayReportButton } from "@/modules/reportes/components/InstantLastDayReportButton";
import { Scale, Ruler, Gauge } from "lucide-react";

const iconColors = {
  Scale: "text-orange-500",
  Ruler: "text-sky-500",
  Gauge: "text-orange-500",
} as const;

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ planta?: string }>;
}) {
  const user = await getUserProfile();
  if (!user) redirect("/login");

  const params = await searchParams;
  const planta = resolvePlantaForUser(user, params.planta);
  const q = `?planta=${planta}`;

  const cards = [
    {
      href: `/dashboard/reportes/kilos${q}`,
      title: "Kilos totales",
      description: "Suma de peso total por máquina y no. máquina: día, mes o rango de fechas.",
      icon: Scale,
      iconColor: iconColors.Scale,
      available: true,
    },
    {
      href: `/dashboard/reportes/metros${q}`,
      title: "Metros totales",
      description: "Suma de metros por máquina y no. máquina: día, mes o rango de fechas.",
      icon: Ruler,
      iconColor: iconColors.Ruler,
      available: true,
    },
    {
      href: `/dashboard/reportes/productividad${q}`,
      title: "Productividad por máquina",
      description: "Detalle por proyecto/producto y % vs capacidad (reglas en base de datos).",
      icon: Gauge,
      iconColor: iconColors.Gauge,
      available: true,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Reportes</h1>
        <p className="mt-1 text-sm text-slate-400">
          Consultas por periodo sobre la producción de la planta activa.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/25 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-100">Vista rápida</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Kilos, metros y productividad por máquina para la{" "}
            <span className="text-slate-400">última fecha con reportes</span>{" "}
            (mismo criterio que el inicio del dashboard).
          </p>
        </div>
        <InstantLastDayReportButton planta={planta} />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const inner = (
            <div
              className={`gradient-ring-surface relative flex h-full flex-col overflow-hidden rounded-2xl p-5 shadow-xl shadow-blue-950/30 transition duration-300 ${
                c.available
                  ? "hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/5 via-transparent to-orange-500/5" />
              <div className="relative">
                <Icon className={`mb-3 h-8 w-8 ${c.iconColor}`} strokeWidth={1.75} />
                <h2 className="text-lg font-semibold text-white">{c.title}</h2>
                <p className="mt-2 flex-1 text-sm text-slate-400">{c.description}</p>
                {c.available && (
                  <span className="mt-4 inline-block bg-gradient-to-r from-sky-400 to-amber-400 bg-clip-text text-sm font-bold text-transparent">
                    Abrir →
                  </span>
                )}
              </div>
            </div>
          );

          return (
            <li key={c.title}>
              {c.available ? (
                <Link href={c.href} className="block h-full">
                  {inner}
                </Link>
              ) : (
                <div className="h-full">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
