"use server";

import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { PRODUCCION_TABLE } from "@/modules/captura/plantConfig";
import type { PlantaValue } from "@/modules/dashboard/plants";

export type ProductividadReportMode = "day" | "month" | "range";

export type ProductividadDetailLine = {
  proyecto: string;
  producto: string;
  longitud: string;
  cantidadSum: number;
};

export type ProductividadBlock = {
  blockId: string;
  reglaId: string;
  reglaEtiqueta: string;
  noMaquinaLabel: string;
  capacidad: number;
  metricaNumerador: "cantidad_producida" | "metros";
  multiplicador: number;
  rawMetricSum: number;
  numeradorAjustado: number;
  productividadPct: number;
  lines: ProductividadDetailLine[];
};

export type ProductividadMaquinaGroup = {
  maquina: string;
  blocks: ProductividadBlock[];
};

type ReglaRow = {
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
};

export type ProdRow = {
  maquina: string | null;
  no_maquina: string | number | null;
  proyecto: string | null;
  producto: string | null;
  longitud: string | number | null;
  cantidad_producida: string | number | null;
  metros: string | number | null;
};

function lastDayOfMonthYm(ym: string): string {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return ym + "-28";
  const end = new Date(y, m, 0);
  const dd = String(end.getDate()).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function parseNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const t = String(v).trim().replace(",", ".");
  if (!t) return 0;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function normalizeMaquina(m: string | null | undefined): string {
  return (m ?? "").trim().toLowerCase();
}

function matchesMaquina(rowMaquina: string | null, patron: string, modo: string): boolean {
  const a = normalizeMaquina(rowMaquina);
  const p = patron.trim().toLowerCase();
  if (!p) return false;
  if (modo === "igual") return a === p;
  if (modo === "prefijo") return a.startsWith(p);
  if (modo === "contiene") return a.includes(p);
  return false;
}

function normalizeNoToken(v: string | number | null | undefined): string {
  if (v == null) return "";
  return String(v).trim();
}

function noMaquinaInList(v: string | number | null, list: unknown): boolean {
  if (!Array.isArray(list) || list.length === 0) return false;
  const s = normalizeNoToken(v);
  for (const x of list) {
    const xs = String(x).trim();
    if (xs === s) return true;
    const nRow = Number(s);
    const nL = Number(xs);
    if (Number.isFinite(nRow) && Number.isFinite(nL) && nRow === nL) return true;
  }
  return false;
}

function matchesNoMaquina(rowNo: string | number | null, modo: string, valores: unknown): boolean {
  if (modo === "cualquiera") return true;
  return noMaquinaInList(rowNo, valores);
}

function normalizeProducto(p: string | null | undefined): string {
  return (p ?? "").trim().toLowerCase();
}

function matchesProducto(producto: string | null, regla: ReglaRow): boolean {
  const modo = regla.producto_modo;
  if (modo === "ninguno") return true;
  if (modo === "igual_normalizado") {
    const pv = (regla.producto_valor ?? "").trim().toLowerCase();
    return normalizeProducto(producto) === pv;
  }
  if (modo === "soldadura_no_es_viga_ni_puntal") {
    const p = normalizeProducto(producto);
    if (!p) return true;
    return p !== "viga" && p !== "puntal";
  }
  return false;
}

function matchesPlanta(regla: ReglaRow, planta: PlantaValue): boolean {
  return regla.planta == null || regla.planta === planta;
}

function pickRegla(reglas: ReglaRow[], row: ProdRow, planta: PlantaValue): ReglaRow | null {
  for (const r of reglas) {
    if (!matchesPlanta(r, planta)) continue;
    if (!matchesMaquina(row.maquina, r.maquina_patron, r.maquina_modo)) continue;
    if (!matchesNoMaquina(row.no_maquina, r.no_maquina_modo, r.no_maquina_valores)) continue;
    if (!matchesProducto(row.producto, r)) continue;
    return r;
  }
  return null;
}

function maquinaDisplay(m: string | null | undefined): string {
  const t = (m ?? "").trim();
  return t || "(Sin máquina)";
}

function noMaquinaDisplay(v: string | number | null | undefined): string {
  if (v == null || v === "") return "(Sin no. máquina)";
  return String(v);
}

function longitudKey(v: string | number | null | undefined): string {
  if (v == null) return "";
  return String(v).trim();
}

function compareNoMaquina(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
}

/** Agrega productividad a partir de filas ya cargadas (misma lógica que el reporte por periodo). */
function aggregateProductividadMaquinas(
  planta: PlantaValue,
  reglas: ReglaRow[],
  prodRows: ProdRow[]
): {
  maquinas: ProductividadMaquinaGroup[];
  rowCount: number;
  omittedCount: number;
  unmatchedCount: number;
} {
  let omittedCount = 0;
  let unmatchedCount = 0;

  type AccKey = string;
  const acc = new Map<
    AccKey,
    {
      regla: ReglaRow;
      maquina: string;
      noLabel: string;
      rawMetric: number;
      detailMap: Map<string, { proyecto: string; producto: string; longitud: string; cant: number }>;
    }
  >();

  for (const row of prodRows) {
    const r = pickRegla(reglas, row, planta);
    if (!r) {
      unmatchedCount += 1;
      continue;
    }
    if (r.omitir_en_reporte) {
      omittedCount += 1;
      continue;
    }
    const cap = r.capacidad_diaria;
    if (cap == null || cap <= 0) continue;

    const m = maquinaDisplay(row.maquina);
    const noL = noMaquinaDisplay(row.no_maquina);
    const key: AccKey = `${r.id}\t${m}\t${noL}`;

    const metric =
      r.metrica_numerador === "metros" ? parseNum(row.metros) : parseNum(row.cantidad_producida);

    let g = acc.get(key);
    if (!g) {
      g = {
        regla: r,
        maquina: m,
        noLabel: noL,
        rawMetric: 0,
        detailMap: new Map(),
      };
      acc.set(key, g);
    }

    g.rawMetric += metric;

    const proyecto = (row.proyecto ?? "").trim() || "—";
    const producto = (row.producto ?? "").trim() || "—";
    const longitud = longitudKey(row.longitud) || "—";
    const dKey = `${proyecto}\t${producto}\t${longitud}`;
    const cant = parseNum(row.cantidad_producida);
    const prev = g.detailMap.get(dKey);
    if (prev) prev.cant += cant;
    else g.detailMap.set(dKey, { proyecto, producto, longitud, cant });
  }

  const byMaquina = new Map<string, ProductividadBlock[]>();

  for (const g of acc.values()) {
    const r = g.regla;
    const mult = Number(r.multiplicador_numerador) || 1;
    const cap = Number(r.capacidad_diaria) || 1;
    const numeradorAjustado = g.rawMetric * mult;
    const productividadPct = cap > 0 ? (numeradorAjustado / cap) * 100 : 0;

    const lines: ProductividadDetailLine[] = [...g.detailMap.values()]
      .map((d) => ({
        proyecto: d.proyecto,
        producto: d.producto,
        longitud: d.longitud,
        cantidadSum: Math.round(d.cant * 100) / 100,
      }))
      .sort((a, b) => {
        const c = a.proyecto.localeCompare(b.proyecto, "es", { sensitivity: "base" });
        if (c !== 0) return c;
        const c2 = a.producto.localeCompare(b.producto, "es", { sensitivity: "base" });
        if (c2 !== 0) return c2;
        return a.longitud.localeCompare(b.longitud, "es", { numeric: true });
      });

    const block: ProductividadBlock = {
      blockId: `${g.maquina}|${r.id}|${g.noLabel}`,
      reglaId: r.id,
      reglaEtiqueta: r.etiqueta,
      noMaquinaLabel: g.noLabel,
      capacidad: Math.round(cap * 100) / 100,
      metricaNumerador: r.metrica_numerador === "metros" ? "metros" : "cantidad_producida",
      multiplicador: mult,
      rawMetricSum: Math.round(g.rawMetric * 100) / 100,
      numeradorAjustado: Math.round(numeradorAjustado * 100) / 100,
      productividadPct: Math.round(productividadPct * 10) / 10,
      lines,
    };

    if (!byMaquina.has(g.maquina)) byMaquina.set(g.maquina, []);
    byMaquina.get(g.maquina)!.push(block);
  }

  const maquinas: ProductividadMaquinaGroup[] = [...byMaquina.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "es", { sensitivity: "base" }))
    .map(([maquina, blocks]) => ({
      maquina,
      blocks: blocks.sort((x, y) => {
        const c = compareNoMaquina(x.noMaquinaLabel, y.noMaquinaLabel);
        if (c !== 0) return c;
        return x.reglaEtiqueta.localeCompare(y.reglaEtiqueta, "es", { sensitivity: "base" });
      }),
    }));

  return {
    maquinas,
    rowCount: prodRows.length,
    omittedCount,
    unmatchedCount,
  };
}

export async function buildProductividadFromProdRows(
  planta: PlantaValue,
  prodRows: ProdRow[]
): Promise<
  | {
      ok: true;
      maquinas: ProductividadMaquinaGroup[];
      rowCount: number;
      omittedCount: number;
      unmatchedCount: number;
    }
  | { ok: false; error: string }
> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: reglasRaw, error: reglasErr } = await supabase
    .from("productividad_maquina_regla")
    .select(
      "id, planta, prioridad, omitir_en_reporte, etiqueta, maquina_patron, maquina_modo, no_maquina_modo, no_maquina_valores, capacidad_diaria, metrica_numerador, multiplicador_numerador, producto_modo, producto_valor"
    )
    .eq("activo", true)
    .order("prioridad", { ascending: false });

  if (reglasErr) {
    return { ok: false, error: reglasErr.message };
  }

  const reglas = (reglasRaw ?? []) as ReglaRow[];
  const agg = aggregateProductividadMaquinas(planta, reglas, prodRows);
  return { ok: true, ...agg };
}

export async function getProductividadReport(
  planta: PlantaValue,
  mode: ProductividadReportMode,
  day?: string,
  monthYm?: string,
  rangeStart?: string,
  rangeEnd?: string
): Promise<
  | {
      ok: true;
      mode: ProductividadReportMode;
      maquinas: ProductividadMaquinaGroup[];
      rowCount: number;
      omittedCount: number;
      unmatchedCount: number;
    }
  | { ok: false; error: string }
> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PRODUCCION_TABLE[planta];

  const { data: reglasRaw, error: reglasErr } = await supabase
    .from("productividad_maquina_regla")
    .select(
      "id, planta, prioridad, omitir_en_reporte, etiqueta, maquina_patron, maquina_modo, no_maquina_modo, no_maquina_valores, capacidad_diaria, metrica_numerador, multiplicador_numerador, producto_modo, producto_valor"
    )
    .eq("activo", true)
    .order("prioridad", { ascending: false });

  if (reglasErr) {
    return { ok: false, error: reglasErr.message };
  }

  const reglas = (reglasRaw ?? []) as ReglaRow[];

  let q = supabase
    .from(table)
    .select(
      "maquina, no_maquina, proyecto, producto, longitud, cantidad_producida, metros, fecha"
    )
    .order("maquina", { ascending: true })
    .order("no_maquina", { ascending: true });

  if (mode === "day") {
    const d = (day ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return { ok: false, error: "Selecciona un día válido (YYYY-MM-DD)." };
    }
    q = q.eq("fecha", d);
  } else if (mode === "month") {
    const ym = (monthYm ?? "").trim();
    if (!/^\d{4}-\d{2}$/.test(ym)) {
      return { ok: false, error: "Selecciona un mes válido (YYYY-MM)." };
    }
    const start = `${ym}-01`;
    const end = lastDayOfMonthYm(ym);
    q = q.gte("fecha", start).lte("fecha", end);
  } else {
    const a = (rangeStart ?? "").trim();
    const b = (rangeEnd ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) {
      return { ok: false, error: "Indica fecha inicio y fin válidas." };
    }
    if (a > b) {
      return { ok: false, error: "La fecha inicial no puede ser posterior a la final." };
    }
    q = q.gte("fecha", a).lte("fecha", b);
  }

  const { data: prodRaw, error: prodErr } = await q;

  if (prodErr) {
    return { ok: false, error: prodErr.message };
  }

  const prodRows = (prodRaw ?? []) as ProdRow[];
  const { maquinas, rowCount, omittedCount, unmatchedCount } = aggregateProductividadMaquinas(
    planta,
    reglas,
    prodRows
  );

  return {
    ok: true,
    mode,
    maquinas,
    rowCount,
    omittedCount,
    unmatchedCount,
  };
}
