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

    const { data } = await supabase
      .from("usuarios")
      .select("id, name, role, planta")
      .eq("id", user.id)
      .single();

    if (data) {
      return {
        id: data.id,
        name: data.name,
        role: (data.role as UserRole) || "capturista",
        planta: data.planta || "llave2",
      };
    }

    return {
      id: user.id,
      name: user.email?.split("@")[0] || "Usuario",
      role: "capturista" as UserRole,
      planta: "llave2",
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
