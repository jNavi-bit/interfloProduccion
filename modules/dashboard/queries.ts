import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import type { UserProfile, UserRole, DashboardStats, RecentRecord } from "./types";

function getTableName(planta: string) {
  if (planta === "llave2") return "llave2Produccion";
  if (planta === "periferico") return "perifericoProduccion";
  if (planta === "perisur") return "perisurProduccion";
  return "llave2Produccion";
}

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
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = getTableName(planta);

  const { data: lastRecord } = await supabase
    .from(table)
    .select("fecha")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  const lastDate = lastRecord?.fecha || null;

  if (!lastDate) {
    return {
      lastDate: null,
      totalMerma: 0,
      totalProducido: 0,
      componentesFabricados: 0,
      maquinaEficiente: null,
    };
  }

  const { data: records } = await supabase
    .from(table)
    .select("*")
    .eq("fecha", lastDate);

  const safeRecords = records || [];

  const totalMerma = safeRecords.reduce((acc, r) => {
    return acc + (parseFloat(r.kg_merma) || 0);
  }, 0);

  const totalProducido = safeRecords.reduce((acc, r) => {
    const qty =
      typeof r.cantidad_producida === "number"
        ? r.cantidad_producida
        : parseInt(r.cantidad_producida) || 0;
    return acc + qty;
  }, 0);

  const machineMap = new Map<string, number>();
  for (const r of safeRecords) {
    const key = r.maquina || "Desconocida";
    const qty =
      typeof r.cantidad_producida === "number"
        ? r.cantidad_producida
        : parseInt(r.cantidad_producida) || 0;
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

  return {
    lastDate,
    totalMerma: Math.round(totalMerma * 100) / 100,
    totalProducido,
    componentesFabricados: safeRecords.length,
    maquinaEficiente,
  };
}

export async function getRecentActivity(
  planta: string
): Promise<RecentRecord[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = getTableName(planta);

  const { data } = await supabase
    .from(table)
    .select(
      "id, capturista, fecha, producto, componente, maquina, cantidad_producida"
    )
    .order("id", { ascending: false })
    .limit(8);

  return (data as RecentRecord[]) || [];
}
