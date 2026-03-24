import { Trash2, Layers, Factory, Zap } from "lucide-react";
import { PLANTA_OPTIONS } from "@/modules/dashboard/plants";
import { StatCard } from "./StatCard";
import { getDashboardHomeData } from "../queries";
import type { UserProfile } from "../types";

interface HomePageProps {
  user: UserProfile;
  planta: string;
}

function formatLastCapturedLabel(iso: string): string {
  const parts = iso.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso;
  const [y, m, d] = parts;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function HomePage({ user, planta }: HomePageProps) {
  const { stats, recentActivity } = await getDashboardHomeData(planta);
  const lastDayLabel = stats.lastDate ? formatLastCapturedLabel(stats.lastDate) : null;
  const plantaLabel =
    PLANTA_OPTIONS.find((o) => o.value === planta)?.label ?? planta;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-strong sm:text-3xl">
          Bienvenido, {user.name}
        </h1>
        <p className="mt-1 text-sm text-mute">
          {lastDayLabel ? (
            <>
              Resumen del día{" "}
              <span className="font-medium text-main">{lastDayLabel}</span>{" "}
              (última fecha con reportes). Planta{" "}
              <span className="font-medium text-main">{plantaLabel}</span>.
            </>
          ) : (
            <>
              Aún no hay fechas con reportes en esta planta.{" "}
              <span className="font-medium text-main">{plantaLabel}</span>.
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Merma total"
          value={stats.totalMerma > 0 ? `${stats.totalMerma} kg` : "Sin datos"}
          icon={<Trash2 className="h-5 w-5" strokeWidth={2} />}
          color="amber"
        />
        <StatCard
          label="Cantidad producida"
          value={
            stats.totalProducido > 0
              ? stats.totalProducido.toLocaleString()
              : "Sin datos"
          }
          icon={<Layers className="h-5 w-5" strokeWidth={2} />}
          color="emerald"
        />
        <StatCard
          label="Registros capturados"
          value={stats.componentesFabricados}
          icon={<Factory className="h-5 w-5" strokeWidth={2} />}
          color="sky"
        />
        <StatCard
          label="Máquina más eficiente"
          value={stats.maquinaEficiente || "Sin datos"}
          icon={<Zap className="h-5 w-5" strokeWidth={2} />}
          color="orange"
        />
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-strong">
          {lastDayLabel ? (
            <>
              Registros del día{" "}
              <span className="text-main">{lastDayLabel}</span>{" "}
              <span className="text-mute font-normal">
                (última fecha con reportes)
              </span>
            </>
          ) : (
            "Registros del día"
          )}
        </h2>
        <p className="mt-1 text-sm text-mute">
          {lastDayLabel
            ? "Todas las filas de ese día, del registro más reciente al más antiguo (por id)."
            : "Cuando existan reportes con fecha, aquí verás todas las filas de ese día."}
        </p>

        <div className="ui-table-wrap mt-4">
          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              No hay registros de producción aún.
            </div>
          ) : (
            <div className="max-h-[min(70vh,48rem)] overflow-auto">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Fecha</th>
                    <th className="whitespace-nowrap px-4 py-3">Capturista</th>
                    <th className="whitespace-nowrap px-4 py-3">Producto</th>
                    <th className="whitespace-nowrap px-4 py-3">Componente</th>
                    <th className="whitespace-nowrap px-4 py-3">Máquina</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {record.fecha || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {record.capturista || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-sky-100">
                        {record.producto || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {record.componente || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {record.maquina || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-medium tabular-nums text-sky-300">
                        {record.cantidad_producida?.toLocaleString() ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
