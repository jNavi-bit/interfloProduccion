"use server";

import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { getUserProfile } from "@/modules/dashboard/queries";
import { PRODUCCION_TABLE } from "@/modules/captura/plantConfig";
import { PROD_TERMINADO_TABLE } from "@/modules/entregaPt/plantConfig";
import {
  coerceListaNumeros,
  etiquetaParaUnNumero,
  validateListaUnSoloNumeroMaquina,
} from "@/modules/configuracion/productividadReglaUtils";

export type ProductividadReglaConfigRow = {
  id: string;
  planta: string | null;
  prioridad: number;
  omitir_en_reporte: boolean;
  etiqueta: string;
  maquina_patron: string;
  maquina_modo: string;
  no_maquina_modo: string;
  no_maquina_valores: unknown;
  capacidad_diaria: number | null;
  metrica_numerador: string;
  multiplicador_numerador: number;
  producto_modo: string;
  producto_valor: string | null;
  descripcion_formula: string | null;
  activo: boolean;
  updated_at: string;
};

export type PurgeTargets = {
  capturaLlave2: boolean;
  capturaPeriferico: boolean;
  capturaPerisur: boolean;
  ptLlave2: boolean;
  ptPeriferico: boolean;
  ptPerisur: boolean;
};

async function requireAdmin() {
  const user = await getUserProfile();
  if (!user || user.role !== "admin") {
    return { ok: false as const, error: "Solo administradores pueden realizar esta acción." };
  }
  return { ok: true as const, user };
}

export async function listProductividadReglasConfig(): Promise<
  { ok: true; rows: ProductividadReglaConfigRow[] } | { ok: false; error: string }
> {
  const user = await getUserProfile();
  if (!user) {
    return { ok: false, error: "No autenticado." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("productividad_maquina_regla")
    .select(
      "id, planta, prioridad, omitir_en_reporte, etiqueta, maquina_patron, maquina_modo, no_maquina_modo, no_maquina_valores, capacidad_diaria, metrica_numerador, multiplicador_numerador, producto_modo, producto_valor, descripcion_formula, activo, updated_at"
    )
    .order("etiqueta", { ascending: true })
    .order("prioridad", { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, rows: (data as ProductividadReglaConfigRow[]) ?? [] };
}

export type UpdateProductividadReglaInput = {
  id: string;
  planta: string | null;
  prioridad: number;
  omitir_en_reporte: boolean;
  etiqueta: string;
  maquina_patron: string;
  maquina_modo: string;
  no_maquina_modo: string;
  no_maquina_valores_json: string;
  capacidad_diaria: number | null;
  metrica_numerador: string;
  multiplicador_numerador: number;
  producto_modo: string;
  producto_valor: string | null;
  descripcion_formula: string | null;
  activo: boolean;
};

export async function updateProductividadRegla(
  input: UpdateProductividadReglaInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const etiqueta = input.etiqueta.trim();
  if (!etiqueta) {
    return { ok: false, error: "La etiqueta no puede quedar vacía." };
  }

  let noMaquinaValores: unknown = null;
  if (input.no_maquina_modo === "lista") {
    const t = input.no_maquina_valores_json.trim();
    if (!t) {
      return { ok: false, error: "Con modo «lista», indica un arreglo con un solo valor (ej. [1])." };
    }
    try {
      noMaquinaValores = JSON.parse(t) as unknown;
      if (!Array.isArray(noMaquinaValores)) {
        return { ok: false, error: "no_maquina_valores debe ser un arreglo JSON." };
      }
      const errLista = validateListaUnSoloNumeroMaquina(noMaquinaValores);
      if (errLista) {
        return { ok: false, error: errLista };
      }
    } catch {
      return { ok: false, error: "JSON inválido en números de máquina." };
    }
  }

  const planta =
    input.planta === "" || input.planta == null
      ? null
      : (["llave2", "periferico", "perisur"].includes(input.planta) ? input.planta : null);

  if (input.planta && input.planta !== "" && planta == null) {
    return { ok: false, error: "Planta no válida." };
  }

  const omitir = input.omitir_en_reporte;
  const cap = omitir ? null : input.capacidad_diaria;
  if (!omitir && (cap == null || cap <= 0)) {
    return { ok: false, error: "Capacidad diaria debe ser mayor que 0 (o marca «omitir»)." };
  }

  if (input.producto_modo === "igual_normalizado") {
    const pv = (input.producto_valor ?? "").trim();
    if (!pv) {
      return { ok: false, error: "Indica producto_valor cuando el modo es «igual normalizado»." };
    }
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("productividad_maquina_regla")
    .update({
      planta,
      prioridad: Math.round(input.prioridad),
      omitir_en_reporte: omitir,
      etiqueta,
      maquina_patron: input.maquina_patron.trim(),
      maquina_modo: input.maquina_modo,
      no_maquina_modo: input.no_maquina_modo,
      no_maquina_valores: noMaquinaValores,
      capacidad_diaria: cap,
      metrica_numerador: input.metrica_numerador,
      multiplicador_numerador: input.multiplicador_numerador,
      producto_modo: input.producto_modo,
      producto_valor:
        input.producto_modo === "igual_normalizado"
          ? (input.producto_valor ?? "").trim()
          : null,
      descripcion_formula: input.descripcion_formula?.trim() || null,
      activo: input.activo,
    })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

type ProductividadReglaDbRow = Record<string, unknown>;

function payloadInsertFromRow(
  row: ProductividadReglaDbRow,
  overrides: { etiqueta: string; no_maquina_valores: unknown[] }
) {
  return {
    planta: row.planta ?? null,
    prioridad: row.prioridad,
    omitir_en_reporte: row.omitir_en_reporte,
    etiqueta: overrides.etiqueta,
    maquina_patron: row.maquina_patron,
    maquina_modo: row.maquina_modo,
    no_maquina_modo: row.no_maquina_modo,
    no_maquina_valores: overrides.no_maquina_valores,
    capacidad_diaria: row.capacidad_diaria,
    metrica_numerador: row.metrica_numerador,
    multiplicador_numerador: row.multiplicador_numerador,
    producto_modo: row.producto_modo,
    producto_valor: row.producto_valor ?? null,
    descripcion_formula: row.descripcion_formula ?? null,
    activo: row.activo,
  };
}

/**
 * Parte reglas con no_maquina_modo=lista y varios valores en un registro por valor.
 * Ajusta etiquetas con {@link etiquetaParaUnNumero} (ej. "Fontai" + [1,2] → "Fontai 1", "Fontai 2").
 */
export async function splitProductividadReglasListaMultiples(): Promise<
  | { ok: true; reglasAfectadas: number; filasNuevas: number }
  | { ok: false; error: string }
> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: rows, error: listErr } = await supabase
    .from("productividad_maquina_regla")
    .select("*")
    .eq("no_maquina_modo", "lista");

  if (listErr) {
    return { ok: false, error: listErr.message };
  }

  const listaRows = (rows as ProductividadReglaDbRow[]) ?? [];
  let reglasAfectadas = 0;
  let filasNuevas = 0;

  for (const row of listaRows) {
    const arr = coerceListaNumeros(row.no_maquina_valores);
    if (!arr || arr.length <= 1) continue;

    reglasAfectadas += 1;
    const etiquetaOriginal = String(row.etiqueta ?? "");
    const first = arr[0];
    const firstLabel = etiquetaParaUnNumero(etiquetaOriginal, first);

    const { error: upErr } = await supabase
      .from("productividad_maquina_regla")
      .update({
        no_maquina_valores: [first],
        etiqueta: firstLabel,
      })
      .eq("id", row.id as string);

    if (upErr) {
      return { ok: false, error: `Al actualizar regla ${String(row.id)}: ${upErr.message}` };
    }

    for (let i = 1; i < arr.length; i++) {
      const v = arr[i];
      const payload = payloadInsertFromRow(row, {
        etiqueta: etiquetaParaUnNumero(etiquetaOriginal, v),
        no_maquina_valores: [v],
      });
      const { error: insErr } = await supabase.from("productividad_maquina_regla").insert(payload);
      if (insErr) {
        return { ok: false, error: `Al duplicar regla (${etiquetaOriginal}, no. ${String(v)}): ${insErr.message}` };
      }
      filasNuevas += 1;
    }
  }

  return { ok: true, reglasAfectadas, filasNuevas };
}

function tableMapFromTargets(t: PurgeTargets): { key: keyof PurgeTargets; table: string }[] {
  const out: { key: keyof PurgeTargets; table: string }[] = [];
  if (t.capturaLlave2) out.push({ key: "capturaLlave2", table: PRODUCCION_TABLE.llave2 });
  if (t.capturaPeriferico) out.push({ key: "capturaPeriferico", table: PRODUCCION_TABLE.periferico });
  if (t.capturaPerisur) out.push({ key: "capturaPerisur", table: PRODUCCION_TABLE.perisur });
  if (t.ptLlave2) out.push({ key: "ptLlave2", table: PROD_TERMINADO_TABLE.llave2 });
  if (t.ptPeriferico) out.push({ key: "ptPeriferico", table: PROD_TERMINADO_TABLE.periferico });
  if (t.ptPerisur) out.push({ key: "ptPerisur", table: PROD_TERMINADO_TABLE.perisur });
  return out;
}

export async function previewPurgeProduccionAntesDe(
  fechaCorte: string,
  targets: PurgeTargets
): Promise<
  | { ok: true; counts: { table: string; count: number | null }[]; total: number }
  | { ok: false; error: string }
> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const d = fechaCorte.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return { ok: false, error: "Fecha de corte inválida (usa YYYY-MM-DD)." };
  }

  const tables = tableMapFromTargets(targets);
  if (tables.length === 0) {
    return { ok: false, error: "Selecciona al menos una tabla." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const counts: { table: string; count: number | null }[] = [];
  let total = 0;

  for (const { table } of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .lt("fecha", d);

    if (error) {
      return { ok: false, error: `${table}: ${error.message}` };
    }
    const c = count ?? 0;
    total += c;
    counts.push({ table, count: c });
  }

  return { ok: true, counts, total };
}

const CONFIRM_PURGE = "ELIMINAR";

export async function executePurgeProduccionAntesDe(
  fechaCorte: string,
  targets: PurgeTargets,
  confirmacion: string
): Promise<
  | { ok: true; deleted: { table: string; count: number }[] }
  | { ok: false; error: string }
> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (confirmacion.trim() !== CONFIRM_PURGE) {
    return { ok: false, error: `Escribe exactamente ${CONFIRM_PURGE} para confirmar.` };
  }

  const d = fechaCorte.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return { ok: false, error: "Fecha de corte inválida (usa YYYY-MM-DD)." };
  }

  const tables = tableMapFromTargets(targets);
  if (tables.length === 0) {
    return { ok: false, error: "Selecciona al menos una tabla." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const deleted: { table: string; count: number }[] = [];

  for (const { table } of tables) {
    const { count: before } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .lt("fecha", d);

    const n = before ?? 0;
    if (n === 0) {
      deleted.push({ table, count: 0 });
      continue;
    }

    const { error } = await supabase.from(table).delete().lt("fecha", d);
    if (error) {
      return { ok: false, error: `${table}: ${error.message}` };
    }
    deleted.push({ table, count: n });
  }

  return { ok: true, deleted };
}
