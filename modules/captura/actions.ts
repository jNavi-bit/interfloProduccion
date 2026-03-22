"use server";

import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import type { PlantaValue } from "@/modules/dashboard/plants";
import { PRODUCCION_TABLE, normalizeRowFromDb, rowToDbPayload } from "./plantConfig";
import {
  getProduccionRowsLatest,
  getAllProduccionRowsForExport,
  noRegistroFromDbRow,
} from "./queries";
import type { CatalogoSkuResult } from "./types";
import type { ProduccionRowState } from "./types";

export type SaveRowResult =
  | { ok: true; id: number; noRegistro?: number }
  | { ok: false; error: string };

/** Misma ventana que la carga inicial de captura (para refrescar tras cambios en BD). */
export async function reloadCapturaProduccionSnapshot(
  planta: PlantaValue,
  limitPlusOne: number
) {
  return getProduccionRowsLatest(planta, limitPlusOne);
}

export async function fetchAllProduccionRowsForExcel(planta: PlantaValue) {
  return getAllProduccionRowsForExport(planta);
}

export async function saveProduccionRow(
  planta: PlantaValue,
  row: { id?: number; values: Record<string, string> }
): Promise<SaveRowResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PRODUCCION_TABLE[planta];
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

export async function deleteProduccionRows(
  planta: PlantaValue,
  ids: number[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (ids.length === 0) return { ok: true };
  if (ids.length > 5) {
    return { ok: false, error: "Máximo 5 filas por operación." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PRODUCCION_TABLE[planta];

  const { error } = await supabase.from(table).delete().in("id", ids);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Borra muchos ids respetando el límite de 5 por llamada del servidor. */
export async function deleteProduccionRowsInChunks(
  planta: PlantaValue,
  ids: number[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 5) {
    const chunk = unique.slice(i, i + 5);
    const r = await deleteProduccionRows(planta, chunk);
    if (!r.ok) return r;
  }
  return { ok: true };
}

export async function lookupCatalogoBySku(sku: string): Promise<CatalogoSkuResult> {
  const trimmed = sku.trim();
  if (!trimmed) {
    return { found: false };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: exact } = await supabase
    .from("catalogo_productos")
    .select("cliente, componente, acabado, peso_unitario")
    .eq("codigo_unico", trimmed)
    .limit(1)
    .maybeSingle();

  if (exact) {
    return {
      found: true,
      cliente: exact.cliente as string | null,
      componente: exact.componente as string | null,
      acabado: exact.acabado as string | null,
      peso_unitario: exact.peso_unitario as string | null,
    };
  }

  const { data: ci } = await supabase
    .from("catalogo_productos")
    .select("cliente, componente, acabado, peso_unitario")
    .ilike("codigo_unico", trimmed)
    .limit(1)
    .maybeSingle();

  if (ci) {
    return {
      found: true,
      cliente: ci.cliente as string | null,
      componente: ci.componente as string | null,
      acabado: ci.acabado as string | null,
      peso_unitario: ci.peso_unitario as string | null,
    };
  }

  return { found: false };
}

export type ProduccionOlderCursor = {
  beforeFecha: string;
  beforeId: number;
};

/**
 * Filas estrictamente anteriores a `(beforeFecha, beforeId)` en orden (fecha asc, id asc),
 * devueltas en orden ascendente para anteponer a la hoja.
 */
export async function loadProduccionRowsOlder(
  planta: PlantaValue,
  cursor: ProduccionOlderCursor,
  limit: number
): Promise<{
  rows: ProduccionRowState[];
  hasMoreOlder: boolean;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PRODUCCION_TABLE[planta];

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

  const rows: ProduccionRowState[] = ascending.map((row: Record<string, unknown>) => ({
    id: row.id as number,
    noRegistro: noRegistroFromDbRow(row),
    values: normalizeRowFromDb(planta, row),
  }));

  return { rows, hasMoreOlder };
}
