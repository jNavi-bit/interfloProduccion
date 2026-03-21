"use server";

import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import type { PlantaValue } from "@/modules/dashboard/plants";
import { PROD_TERMINADO_TABLE, normalizeRowFromDb, rowToDbPayload } from "./plantConfig";
import { getEntregaPtRowsLatest, noRegistroFromDbRow } from "./queries";
import type { EntregaPtRowState } from "./types";

export type EntregaPtSaveRowResult =
  | { ok: true; id: number; noRegistro?: number }
  | { ok: false; error: string };

export async function reloadEntregaPtSnapshot(planta: PlantaValue, limitPlusOne: number) {
  return getEntregaPtRowsLatest(planta, limitPlusOne);
}

export async function saveEntregaPtRow(
  planta: PlantaValue,
  row: { id?: number; values: Record<string, string> }
): Promise<EntregaPtSaveRowResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PROD_TERMINADO_TABLE[planta];
  const payload = rowToDbPayload(planta, row.values);

  if (row.id) {
    const { error } = await supabase.from(table).update(payload).eq("id", row.id);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: row.id };
  }

  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select("id, no_registro")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }
  const inserted = data as Record<string, unknown>;
  return {
    ok: true,
    id: inserted.id as number,
    noRegistro: noRegistroFromDbRow(inserted),
  };
}

export async function deleteEntregaPtRows(
  planta: PlantaValue,
  ids: number[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (ids.length === 0) return { ok: true };
  if (ids.length > 5) {
    return { ok: false, error: "Máximo 5 filas por operación." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PROD_TERMINADO_TABLE[planta];

  const { error } = await supabase.from(table).delete().in("id", ids);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteEntregaPtRowsInChunks(
  planta: PlantaValue,
  ids: number[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 5) {
    const chunk = unique.slice(i, i + 5);
    const r = await deleteEntregaPtRows(planta, chunk);
    if (!r.ok) return r;
  }
  return { ok: true };
}

export type EntregaPtOlderCursor = {
  beforeFecha: string;
  beforeId: number;
};

export async function loadEntregaPtRowsOlder(
  planta: PlantaValue,
  cursor: EntregaPtOlderCursor,
  limit: number
): Promise<{
  rows: EntregaPtRowState[];
  hasMoreOlder: boolean;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PROD_TERMINADO_TABLE[planta];

  const fetchLimit = limit + 1;
  const f = cursor.beforeFecha.trim();

  let q = supabase
    .from(table)
    .select("*")
    .order("fecha", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(fetchLimit);

  if (!f) {
    q = q.lt("id", cursor.beforeId);
  } else {
    const esc = f.replace(/"/g, '\\"');
    q = q.or(`fecha.lt."${esc}",and(fecha.eq."${esc}",id.lt.${cursor.beforeId})`);
  }

  const { data, error } = await q;

  if (error || !data) {
    return { rows: [], hasMoreOlder: false };
  }

  const hasMoreOlder = data.length === fetchLimit;
  const slice = hasMoreOlder ? data.slice(0, limit) : data;
  const ascending = [...slice].reverse();

  const rows: EntregaPtRowState[] = ascending.map((row: Record<string, unknown>) => ({
    id: row.id as number,
    noRegistro: noRegistroFromDbRow(row),
    values: normalizeRowFromDb(planta, row),
  }));

  return { rows, hasMoreOlder };
}
