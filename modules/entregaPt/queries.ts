import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import type { PlantaValue } from "@/modules/dashboard/plants";
import { PROD_TERMINADO_TABLE, normalizeRowFromDb } from "./plantConfig";
import type { EntregaPtRowState } from "./types";

export function noRegistroFromDbRow(row: Record<string, unknown>): number | undefined {
  const v = row.no_registro;
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toEntregaPtRowState(
  planta: PlantaValue,
  row: Record<string, unknown>
): EntregaPtRowState {
  return {
    id: row.id as number,
    noRegistro: noRegistroFromDbRow(row),
    values: normalizeRowFromDb(planta, row),
  };
}

export async function getEntregaPtRowsLatest(
  planta: PlantaValue,
  limitPlusOne: number
): Promise<{
  rows: EntregaPtRowState[];
  hasMoreOlder: boolean;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PROD_TERMINADO_TABLE[planta];
  const limit = limitPlusOne - 1;

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("fecha", { ascending: false, nullsFirst: true })
    .order("id", { ascending: false })
    .limit(limitPlusOne);

  if (error || !data) {
    console.error("getEntregaPtRowsLatest", error);
    return { rows: [], hasMoreOlder: false };
  }

  const hasMoreOlder = data.length > limit;
  const slice = hasMoreOlder ? data.slice(0, limit) : data;
  const ascending = [...slice].reverse();

  const rows: EntregaPtRowState[] = ascending.map((row: Record<string, unknown>) =>
    toEntregaPtRowState(planta, row)
  );

  return { rows, hasMoreOlder };
}

const EXPORT_PAGE_SIZE = 1000;

/** Todas las filas persistidas (orden: fecha asc, id asc), para exportación Excel. */
export async function getAllEntregaPtRowsForExport(
  planta: PlantaValue
): Promise<{ ok: true; rows: EntregaPtRowState[] } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PROD_TERMINADO_TABLE[planta];
  const all: EntregaPtRowState[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("fecha", { ascending: true, nullsFirst: true })
      .order("id", { ascending: true })
      .range(offset, offset + EXPORT_PAGE_SIZE - 1);

    if (error) {
      return { ok: false, error: error.message };
    }
    const batch = data ?? [];
    if (batch.length === 0) break;
    for (const row of batch) {
      all.push(toEntregaPtRowState(planta, row as Record<string, unknown>));
    }
    if (batch.length < EXPORT_PAGE_SIZE) break;
    offset += EXPORT_PAGE_SIZE;
  }
  return { ok: true, rows: all };
}
