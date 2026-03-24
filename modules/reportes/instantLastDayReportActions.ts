"use server";

import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import {
  normalizePerifericoFechaToIso,
  PRODUCCION_TABLE,
} from "@/modules/captura/plantConfig";
import { getDashboardHomeData } from "@/modules/dashboard/queries";
import type { PlantaValue } from "@/modules/dashboard/plants";
import {
  buildProductividadFromProdRows,
  type ProdRow,
} from "./productividadReportActions";

function normalizedFechaIso(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const iso = normalizePerifericoFechaToIso(s);
  return iso === "" ? null : iso;
}

function parsePesoTotal(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const t = String(v).trim().replace(",", ".");
  if (!t) return 0;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function parseMetros(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const t = String(v).trim().replace(",", ".");
  if (!t) return 0;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function noMaquinaLabel(v: string | number | null | undefined): string {
  if (v == null || v === "") return "(Sin no. máquina)";
  return String(v);
}

function maquinaLabel(m: string | null | undefined): string {
  const t = (m ?? "").trim();
  return t || "(Sin máquina)";
}

const ROW_KEY_SEP = "\u001f";

function rowKey(maquina: string, noMaquina: string): string {
  return `${maquina}${ROW_KEY_SEP}${noMaquina}`;
}

type RawFetchRow = {
  fecha: unknown;
  maquina: unknown;
  no_maquina: unknown;
  peso_total: unknown;
  metros: unknown;
  proyecto: unknown;
  producto: unknown;
  longitud: unknown;
  cantidad_producida: unknown;
};

const PAGE = 1000;

export type InstantLastDayReportRow = {
  maquina: string;
  noMaquinaLabel: string;
  kilos: number;
  metros: number;
  productividad: string;
};

/**
 * Reporte simplificado: kilos, metros y % de productividad por máquina / no. máquina
 * para la fecha más reciente que tenga registros (mismo criterio que el inicio del dashboard).
 */
export async function getInstantLastDayMachineReport(planta: PlantaValue): Promise<
  | {
      ok: true;
      fechaIso: string;
      fechaDisplay: string;
      sourceRowCount: number;
      rows: InstantLastDayReportRow[];
      productividadUnmatchedRows: number;
      productividadOmittedRows: number;
    }
  | { ok: false; error: string }
> {
  const { stats } = await getDashboardHomeData(planta);
  const dayIso = stats.lastDate;
  if (!dayIso) {
    return { ok: false, error: "No hay fechas con registros en esta planta." };
  }

  const fechaDisplay = (() => {
    const parts = dayIso.split("-").map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return dayIso;
    const [y, m, d] = parts;
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  })();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const table = PRODUCCION_TABLE[planta];

  const matched: RawFetchRow[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(
        "fecha, maquina, no_maquina, peso_total, metros, proyecto, producto, longitud, cantidad_producida"
      )
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.length) {
      break;
    }

    for (const raw of data) {
      const r = raw as RawFetchRow;
      if (normalizedFechaIso(r.fecha) === dayIso) {
        matched.push(r);
      }
    }

    if (data.length < PAGE) {
      break;
    }
  }

  if (matched.length === 0) {
    return {
      ok: false,
      error:
        "No se encontraron filas para la última fecha con reportes. Puede haber un desajuste de formatos de fecha en la base.",
    };
  }

  const kilosMap = new Map<string, number>();
  const metrosMap = new Map<string, number>();

  for (const r of matched) {
    const m = maquinaLabel(r.maquina as string | null);
    const n = noMaquinaLabel(r.no_maquina as string | number | null);
    const k = rowKey(m, n);
    const kg = parsePesoTotal(r.peso_total as string | number | null);
    const mt = parseMetros(r.metros as string | number | null);
    kilosMap.set(k, (kilosMap.get(k) ?? 0) + kg);
    metrosMap.set(k, (metrosMap.get(k) ?? 0) + mt);
  }

  const prodRows: ProdRow[] = matched.map((r) => ({
    maquina: r.maquina != null ? String(r.maquina) : null,
    no_maquina: r.no_maquina as string | number | null,
    proyecto: r.proyecto != null ? String(r.proyecto) : null,
    producto: r.producto != null ? String(r.producto) : null,
    longitud: r.longitud as string | number | null,
    cantidad_producida: r.cantidad_producida as string | number | null,
    metros: r.metros as string | number | null,
  }));

  const prodAgg = await buildProductividadFromProdRows(planta, prodRows);
  if (!prodAgg.ok) {
    return { ok: false, error: prodAgg.error };
  }

  const productividadByKey = new Map<string, string[]>();
  for (const mg of prodAgg.maquinas) {
    for (const b of mg.blocks) {
      const k = rowKey(mg.maquina, b.noMaquinaLabel);
      const line = `${b.reglaEtiqueta}: ${b.productividadPct}%`;
      if (!productividadByKey.has(k)) productividadByKey.set(k, []);
      productividadByKey.get(k)!.push(line);
    }
  }

  const allKeys = new Set<string>([
    ...kilosMap.keys(),
    ...metrosMap.keys(),
    ...productividadByKey.keys(),
  ]);

  const rows: InstantLastDayReportRow[] = [...allKeys]
    .sort((a, b) => {
      const [ma, na] = a.split(ROW_KEY_SEP);
      const [mb, nb] = b.split(ROW_KEY_SEP);
      const c = ma.localeCompare(mb, "es", { sensitivity: "base" });
      if (c !== 0) return c;
      return na.localeCompare(nb, "es", { numeric: true, sensitivity: "base" });
    })
    .map((k) => {
      const [maquina, noMaquinaLabel] = k.split(ROW_KEY_SEP);
      const parts = productividadByKey.get(k);
      return {
        maquina,
        noMaquinaLabel,
        kilos: Math.round((kilosMap.get(k) ?? 0) * 100) / 100,
        metros: Math.round((metrosMap.get(k) ?? 0) * 100) / 100,
        productividad: parts?.length ? parts.join(" · ") : "—",
      };
    });

  return {
    ok: true,
    fechaIso: dayIso,
    fechaDisplay,
    sourceRowCount: matched.length,
    rows,
    productividadUnmatchedRows: prodAgg.unmatchedCount,
    productividadOmittedRows: prodAgg.omittedCount,
  };
}
