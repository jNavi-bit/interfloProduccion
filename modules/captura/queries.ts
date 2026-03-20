import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import type { PlantaValue } from "@/modules/dashboard/plants";
import { PRODUCCION_TABLE, normalizeRowFromDb } from "./plantConfig";
import type { ProduccionRowState } from "./types";

export function noRegistroFromDbRow(row: Record<string, unknown>): number | undefined {
  const v = row.no_registro;
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toProduccionRowState(
  planta: PlantaValue,
  row: Record<string, unknown>
): ProduccionRowState {
  return {
    id: row.id as number,
    noRegistro: noRegistroFromDbRow(row),
    values: normalizeRowFromDb(planta, row),
  };
}

export async function getProduccionRows(
  planta: PlantaValue,
  limit = 60
): Promise<ProduccionRowState[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PRODUCCION_TABLE[planta];

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("fecha", { ascending: true, nullsFirst: true })
    .order("id", { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error("getProduccionRows", error);
    return [];
  }

  return data.map((row: Record<string, unknown>) => toProduccionRowState(planta, row));
}

/**
 * Ventana más reciente por `fecha` (y `id` como desempate), devuelta en orden ascendente
 * (más antigua arriba dentro del bloque, más nueva abajo) para la hoja.
 */
export async function getProduccionRowsLatest(
  planta: PlantaValue,
  limitPlusOne: number
): Promise<{
  rows: ProduccionRowState[];
  hasMoreOlder: boolean;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PRODUCCION_TABLE[planta];
  const limit = limitPlusOne - 1;

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("fecha", { ascending: false, nullsFirst: true })
    .order("id", { ascending: false })
    .limit(limitPlusOne);

  if (error || !data) {
    console.error("getProduccionRowsLatest", error);
    return { rows: [], hasMoreOlder: false };
  }

  const hasMoreOlder = data.length > limit;
  const slice = hasMoreOlder ? data.slice(0, limit) : data;
  const ascending = [...slice].reverse();

  const rows: ProduccionRowState[] = ascending.map((row: Record<string, unknown>) =>
    toProduccionRowState(planta, row)
  );

  return { rows, hasMoreOlder };
}
