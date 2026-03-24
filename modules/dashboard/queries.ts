import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { normalizePerifericoFechaToIso } from "@/modules/captura/plantConfig";
import type { UserProfile, UserRole, DashboardStats, RecentRecord } from "./types";

function getTableName(planta: string) {
  if (planta === "llave2") return "llave2Produccion";
  if (planta === "periferico") return "perifericoProduccion";
  if (planta === "perisur") return "perisurProduccion";
  return "llave2Produccion";
}

/** Normaliza texto de fecha de BD a ISO YYYY-MM-DD (misma lógica que periférico; sirve para la mayoría de formatos). */
function normalizedFechaIso(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const iso = normalizePerifericoFechaToIso(s);
  return iso === "" ? null : iso;
}

function fechaIsoToUtcMidnightTs(iso: string): number {
  const parts = iso.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return NaN;
  const [y, m, d] = parts;
  return Date.UTC(y, m - 1, d);
}

type ProduccionScanRow = {
  id: number;
  fecha: unknown;
  kg_merma: unknown;
  cantidad_producida: unknown;
  maquina: unknown;
  capturista: unknown;
  producto: unknown;
  componente: unknown;
};

const DASHBOARD_PAGE_SIZE = 1000;

/**
 * Recorre la tabla de producción y determina el último día con registros (fecha máxima normalizada),
 * no el día del último insert por id. Expuesto para el dashboard; las estadísticas y la tabla inferior
 * comparten el mismo barrido (React cache deduplica si se llaman ambas en paralelo).
 * La lista de registros incluye todas las filas de ese día (ordenadas por id descendente).
 */
export const getDashboardHomeData = cache(
  async (
    planta: string
  ): Promise<{ stats: DashboardStats; recentActivity: RecentRecord[] }> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const table = getTableName(planta);

    let maxTs = -Infinity;
    let maxIso: string | null = null;
    const rowsOnMaxDay: ProduccionScanRow[] = [];

    for (let from = 0; ; from += DASHBOARD_PAGE_SIZE) {
      const { data, error } = await supabase
        .from(table)
        .select(
          "id, fecha, kg_merma, cantidad_producida, maquina, capturista, producto, componente"
        )
        .order("id", { ascending: true })
        .range(from, from + DASHBOARD_PAGE_SIZE - 1);

      if (error) {
        return {
          stats: {
            lastDate: null,
            totalMerma: 0,
            totalProducido: 0,
            componentesFabricados: 0,
            maquinaEficiente: null,
          },
          recentActivity: [],
        };
      }

      if (!data?.length) {
        break;
      }

      for (const raw of data) {
        const row = raw as ProduccionScanRow;
        const iso = normalizedFechaIso(row.fecha);
        if (!iso) continue;
        const ts = fechaIsoToUtcMidnightTs(iso);
        if (!Number.isFinite(ts)) continue;

        if (ts > maxTs) {
          maxTs = ts;
          maxIso = iso;
          rowsOnMaxDay.length = 0;
          rowsOnMaxDay.push(row);
        } else if (maxIso !== null && iso === maxIso) {
          rowsOnMaxDay.push(row);
        }
      }

      if (data.length < DASHBOARD_PAGE_SIZE) {
        break;
      }
    }

    if (maxIso === null) {
      return {
        stats: {
          lastDate: null,
          totalMerma: 0,
          totalProducido: 0,
          componentesFabricados: 0,
          maquinaEficiente: null,
        },
        recentActivity: [],
      };
    }

    const totalMerma = rowsOnMaxDay.reduce((acc, r) => {
      return acc + (parseFloat(String(r.kg_merma)) || 0);
    }, 0);

    const totalProducido = rowsOnMaxDay.reduce((acc, r) => {
      const q = r.cantidad_producida;
      const qty =
        typeof q === "number" ? q : parseInt(String(q), 10) || 0;
      return acc + qty;
    }, 0);

    const machineMap = new Map<string, number>();
    for (const r of rowsOnMaxDay) {
      const key = (r.maquina != null && String(r.maquina).trim() !== "")
        ? String(r.maquina)
        : "Desconocida";
      const q = r.cantidad_producida;
      const qty =
        typeof q === "number" ? q : parseInt(String(q), 10) || 0;
      machineMap.set(key, (machineMap.get(key) || 0) + qty);
    }

    let maquinaEficiente: string | null = null;
    let maxProduction = 0;
    for (const [machine, produced] of machineMap) {
      if (produced > maxProduction) {
        maxProduction = produced;
        maquinaEficiente = machine;
      }
    }

    const recentActivity: RecentRecord[] = [...rowsOnMaxDay]
      .sort((a, b) => b.id - a.id)
      .map((r) => ({
        id: r.id,
        capturista:
          r.capturista != null ? String(r.capturista) : null,
        fecha: normalizedFechaIso(r.fecha) ?? (r.fecha != null ? String(r.fecha) : null),
        producto: r.producto != null ? String(r.producto) : null,
        componente: r.componente != null ? String(r.componente) : null,
        maquina: r.maquina != null ? String(r.maquina) : null,
        cantidad_producida:
          typeof r.cantidad_producida === "number"
            ? r.cantidad_producida
            : parseInt(String(r.cantidad_producida), 10) || null,
      }));

    return {
      stats: {
        lastDate: maxIso,
        totalMerma: Math.round(totalMerma * 100) / 100,
        totalProducido,
        componentesFabricados: rowsOnMaxDay.length,
        maquinaEficiente,
      },
      recentActivity,
    };
  }
);

export const getUserProfile = cache(
  async (): Promise<UserProfile | null> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    type RowFull = {
      id: string;
      name: string;
      role: string | null;
      planta: string | null;
      email: string | null;
      must_change_password: boolean | null;
    };
    type RowLegacy = {
      id: string;
      name: string;
      role: string | null;
      planta: string | null;
    };

    const { data: full, error: errFull } = await supabase
      .from("usuarios")
      .select("id, name, role, planta, email, must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    let row: RowFull | null = null;

    if (!errFull && full) {
      row = full as RowFull;
    } else if (errFull) {
      // BD sin columnas nuevas (migración pendiente) u otro error del SELECT amplio.
      const { data: legacy, error: errLegacy } = await supabase
        .from("usuarios")
        .select("id, name, role, planta")
        .eq("id", user.id)
        .maybeSingle();

      if (!errLegacy && legacy) {
        const L = legacy as RowLegacy;
        row = {
          id: L.id,
          name: L.name,
          role: L.role,
          planta: L.planta,
          email: null,
          must_change_password: false,
        };
      }
    }

    if (row) {
      return {
        id: row.id,
        name: row.name,
        role: (row.role as UserRole) || "capturista",
        planta: row.planta || "llave2",
        email: row.email ?? user.email ?? null,
        mustChangePassword: row.must_change_password === true,
      };
    }

    // Sin fila en `usuarios`: sesión Auth válida pero perfil no enlazado (o error de lectura).
    return {
      id: user.id,
      name: user.email?.split("@")[0] || "Usuario",
      role: "capturista" as UserRole,
      planta: "llave2",
      email: user.email ?? null,
      mustChangePassword: false,
    };
  }
);

export async function getDashboardStats(
  planta: string
): Promise<DashboardStats> {
  const { stats } = await getDashboardHomeData(planta);
  return stats;
}

export async function getRecentActivity(
  planta: string
): Promise<RecentRecord[]> {
  const { recentActivity } = await getDashboardHomeData(planta);
  return recentActivity;
}
