"use server";

import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { PRODUCCION_TABLE } from "@/modules/captura/plantConfig";
import type { PlantaValue } from "@/modules/dashboard/plants";

export type KilosReportMode = "day" | "month" | "range";

export type KilosRawRow = {
  id: number;
  no_registro: number | null;
  maquina: string | null;
  no_maquina: string | number | null;
  sku: string | null;
  producto: string | null;
  cantidad_producida: string | number | null;
  peso_total: string | number | null;
  fecha: string | null;
};

export type KilosDetailRow = {
  /** Clave estable para React (PK). */
  id: number;
  /** Número de registro visible (secuencia de negocio), no confundir con `id`. */
  noRegistro: number | null;
  sku: string;
  producto: string;
  cantidadProducida: string;
  pesoTotal: number;
  fecha: string;
};

export type KilosNoMaquinaGroup = {
  noMaquinaLabel: string;
  rows: KilosDetailRow[];
  subtotalKilos: number;
};

export type KilosMaquinaGroup = {
  maquina: string;
  noMaquinaGroups: KilosNoMaquinaGroup[];
  totalKilos: number;
};

export type KilosAggregatedRow = {
  maquina: string;
  noMaquinaLabel: string;
  totalKilos: number;
};

function parsePesoTotal(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const t = String(v).trim().replace(",", ".");
  if (!t) return 0;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function formatCantidad(v: string | number | null | undefined): string {
  if (v == null) return "";
  return String(v);
}

function formatTextField(v: string | null | undefined): string {
  if (v == null) return "";
  const t = String(v).trim();
  return t;
}

function noMaquinaLabel(v: string | number | null | undefined): string {
  if (v == null || v === "") return "(Sin no. máquina)";
  return String(v);
}

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

/** Rango inclusive en fechas `YYYY-MM-DD` (columna `date` en Postgres). */
async function fetchKilosRawRows(
  planta: PlantaValue,
  mode: KilosReportMode,
  day: string | undefined,
  monthYm: string | undefined,
  rangeStart: string | undefined,
  rangeEnd: string | undefined
): Promise<{ ok: true; rows: KilosRawRow[] } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PRODUCCION_TABLE[planta];

  let q = supabase
    .from(table)
    .select(
      "id, no_registro, maquina, no_maquina, sku, producto, cantidad_producida, peso_total, fecha"
    )
    .order("maquina", { ascending: true })
    .order("no_maquina", { ascending: true })
    .order("no_registro", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

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

  const { data, error } = await q;

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, rows: (data as KilosRawRow[]) ?? [] };
}

function buildKilosDailyReport(rows: KilosRawRow[]): KilosMaquinaGroup[] {
  const byMaquina = new Map<string, KilosRawRow[]>();
  for (const r of rows) {
    const m = (r.maquina ?? "").trim() || "(Sin máquina)";
    if (!byMaquina.has(m)) byMaquina.set(m, []);
    byMaquina.get(m)!.push(r);
  }

  const maquinas = [...byMaquina.keys()].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );

  const out: KilosMaquinaGroup[] = [];

  for (const maquina of maquinas) {
    const list = byMaquina.get(maquina)!;
    const byNo = new Map<string, KilosRawRow[]>();
    for (const r of list) {
      const key = noMaquinaLabel(r.no_maquina);
      if (!byNo.has(key)) byNo.set(key, []);
      byNo.get(key)!.push(r);
    }
    const noKeys = [...byNo.keys()].sort((a, b) =>
      a.localeCompare(b, "es", { numeric: true, sensitivity: "base" })
    );

    const noMaquinaGroups: KilosNoMaquinaGroup[] = [];
    let totalKilos = 0;

    for (const nk of noKeys) {
      const chunk = byNo.get(nk)!;
      const detailRows: KilosDetailRow[] = chunk.map((r) => {
        const w = parsePesoTotal(r.peso_total);
        totalKilos += w;
        const nr = r.no_registro;
        return {
          id: r.id,
          noRegistro:
            typeof nr === "number" && Number.isFinite(nr) ? nr : null,
          sku: formatTextField(r.sku),
          producto: formatTextField(r.producto),
          cantidadProducida: formatCantidad(r.cantidad_producida),
          pesoTotal: w,
          fecha: r.fecha ?? "",
        };
      });
      const subtotalKilos = detailRows.reduce((s, x) => s + x.pesoTotal, 0);
      noMaquinaGroups.push({
        noMaquinaLabel: nk,
        rows: detailRows,
        subtotalKilos,
      });
    }

    out.push({ maquina, noMaquinaGroups, totalKilos });
  }

  return out;
}

function buildKilosAggregatedReport(rows: KilosRawRow[]): KilosAggregatedRow[] {
  const key = (m: string, n: string) => `${m}\t${n}`;
  const map = new Map<string, { maquina: string; noMaquinaLabel: string; total: number }>();

  for (const r of rows) {
    const m = (r.maquina ?? "").trim() || "(Sin máquina)";
    const n = noMaquinaLabel(r.no_maquina);
    const k = key(m, n);
    const w = parsePesoTotal(r.peso_total);
    const cur = map.get(k);
    if (cur) cur.total += w;
    else map.set(k, { maquina: m, noMaquinaLabel: n, total: w });
  }

  return [...map.values()]
    .map((v) => ({
      maquina: v.maquina,
      noMaquinaLabel: v.noMaquinaLabel,
      totalKilos: Math.round(v.total * 100) / 100,
    }))
    .sort((a, b) => {
      const c = a.maquina.localeCompare(b.maquina, "es", { sensitivity: "base" });
      if (c !== 0) return c;
      return a.noMaquinaLabel.localeCompare(b.noMaquinaLabel, "es", {
        numeric: true,
        sensitivity: "base",
      });
    });
}

export async function getKilosReport(
  planta: PlantaValue,
  mode: KilosReportMode,
  day?: string,
  monthYm?: string,
  rangeStart?: string,
  rangeEnd?: string
): Promise<
  | {
      ok: true;
      mode: KilosReportMode;
      daily: KilosMaquinaGroup[] | null;
      aggregated: KilosAggregatedRow[] | null;
      rowCount: number;
    }
  | { ok: false; error: string }
> {
  const raw = await fetchKilosRawRows(planta, mode, day, monthYm, rangeStart, rangeEnd);
  if (!raw.ok) return raw;

  const rows = raw.rows;
  if (mode === "day") {
    return {
      ok: true,
      mode,
      daily: buildKilosDailyReport(rows),
      aggregated: null,
      rowCount: rows.length,
    };
  }

  return {
    ok: true,
    mode,
    daily: null,
    aggregated: buildKilosAggregatedReport(rows),
    rowCount: rows.length,
  };
}
