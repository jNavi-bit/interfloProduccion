import { TrendingDown, Layers, Factory, Zap } from "lucide-react";
import { StatCard } from "./StatCard";
import { getDashboardStats, getRecentActivity } from "../queries";
import type { UserProfile } from "../types";

interface HomePageProps {
  user: UserProfile;
}

export async function HomePage({ user }: HomePageProps) {
  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(user.planta),
    getRecentActivity(user.planta),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Bienvenido, {user.name}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Resumen de producción · Planta{" "}
          <span className="font-medium capitalize text-slate-300">
            {user.planta}
          </span>
          {stats.lastDate && (
            <>
              {" "}
              · Último día capturado:{" "}
              <span className="font-medium text-slate-300">
                {stats.lastDate}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Merma total"
          value={stats.totalMerma > 0 ? `${stats.totalMerma} kg` : "Sin datos"}
          subtitle={stats.lastDate ? `Día ${stats.lastDate}` : undefined}
          icon={<TrendingDown className="h-5 w-5" strokeWidth={2} />}
          color="amber"
        />
        <StatCard
          label="Cantidad producida"
          value={
            stats.totalProducido > 0
              ? stats.totalProducido.toLocaleString()
              : "Sin datos"
          }
          subtitle={stats.lastDate ? `Día ${stats.lastDate}` : undefined}
          icon={<Layers className="h-5 w-5" strokeWidth={2} />}
          color="emerald"
        />
        <StatCard
          label="Registros capturados"
          value={stats.componentesFabricados}
          subtitle={stats.lastDate ? `Día ${stats.lastDate}` : undefined}
          icon={<Factory className="h-5 w-5" strokeWidth={2} />}
          color="sky"
        />
        <StatCard
          label="Máquina más eficiente"
          value={stats.maquinaEficiente || "Sin datos"}
          subtitle="Mayor producción del día"
          icon={<Zap className="h-5 w-5" strokeWidth={2} />}
          color="violet"
        />
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-white">
          Actividad reciente
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Últimos registros de producción
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] bg-slate-900/30">
          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              No hay registros de producción aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-400">
                      Fecha
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-400">
                      Capturista
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-400">
                      Producto
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-400">
                      Componente
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-400">
                      Máquina
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-400">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentActivity.map((record) => (
                    <tr
                      key={record.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {record.fecha || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {record.capturista || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                        {record.producto || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {record.componente || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {record.maquina || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-200">
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
