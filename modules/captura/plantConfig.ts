import type { PlantaValue } from "@/modules/dashboard/plants";

export const PRODUCCION_TABLE: Record<PlantaValue, string> = {
  llave2: "llave2Produccion",
  periferico: "perifericoProduccion",
  perisur: "perisurProduccion",
};

export interface CapturaColumn {
  key: string;
  label: string;
  minWidth?: number;
}

/** Orden de columnas en la hoja (coincide con flujo de captura). */
export const CAPTURA_COLUMNS: CapturaColumn[] = [
  { key: "sku", label: "SKU", minWidth: 120 },
  { key: "turno", label: "Turno", minWidth: 72 },
  { key: "proyecto", label: "Proyecto", minWidth: 160 },
  { key: "componente", label: "Componente", minWidth: 180 },
  { key: "color", label: "Color", minWidth: 100 },
  { key: "peso_unitario", label: "Peso unit.", minWidth: 96 },
  { key: "maquina", label: "Máquina", minWidth: 100 },
  { key: "no_maquina", label: "No. máquina", minWidth: 100 },
  { key: "producto", label: "Producto", minWidth: 140 },
  { key: "longitud", label: "Longitud", minWidth: 88 },
  { key: "cantidad_producida", label: "Cant. producida", minWidth: 120 },
  { key: "rechazadas", label: "Rechazadas", minWidth: 96 },
  { key: "metros", label: "Metros", minWidth: 80 },
  { key: "capturista", label: "Capturista", minWidth: 120 },
  { key: "fecha", label: "Fecha", minWidth: 110 },
  { key: "peso_total", label: "Peso total", minWidth: 96 },
  { key: "observaciones", label: "Observaciones", minWidth: 160 },
  { key: "cantidad_planeada", label: "Cant. planeada", minWidth: 120 },
  { key: "cantidad_defectiva", label: "Cant. defectiva", minWidth: 120 },
  { key: "motivo", label: "Motivo", minWidth: 120 },
  { key: "kg_defectivo", label: "Kg defectivo", minWidth: 96 },
  { key: "mt_defectivo", label: "Mt defectivo", minWidth: 96 },
  { key: "merma_puntas_colas_sobrantes", label: "Merma puntas/colas", minWidth: 140 },
  { key: "kg_merma", label: "Kg merma", minWidth: 88 },
  { key: "mt_merma", label: "Mt merma", minWidth: 88 },
];

const COLUMN_KEYS = new Set(CAPTURA_COLUMNS.map((c) => c.key));

/** Misma regla de año que PostgreSQL `to_date(.., 'YY')`: 00–69 → 20xx, 70–99 → 19xx. */
function pgTwoDigitYearToFull(yy: number): number {
  if (yy >= 70) return 1900 + yy;
  return 2000 + yy;
}

function isValidCalendarYmd(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Periférico: normaliza a `YYYY-MM-DD` (acepta ISO, legado `DD-MM-YY` y `DD/MM/...`).
 */
export function normalizePerifericoFechaToIso(raw: string): string {
  const t = raw.trim();
  if (!t) return "";

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (isValidCalendarYmd(y, m, d)) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return t;
  }

  const dmY = /^(\d{1,2})-(\d{1,2})-(\d{2})$/.exec(t);
  if (dmY) {
    const d = Number(dmY[1]);
    const m = Number(dmY[2]);
    const yy = Number(dmY[3]);
    const y = pgTwoDigitYearToFull(yy);
    if (isValidCalendarYmd(y, m, d)) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return t;
  }

  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(t);
  if (slash) {
    const d = Number(slash[1]);
    const m = Number(slash[2]);
    const yPart = Number(slash[3]);
    const y = yPart >= 100 ? yPart : pgTwoDigitYearToFull(yPart);
    if (isValidCalendarYmd(y, m, d)) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return t;
  }

  return t;
}

export function columnIndex(key: string): number {
  return CAPTURA_COLUMNS.findIndex((c) => c.key === key);
}

export function shouldPersistColumn(_planta: PlantaValue, key: string): boolean {
  if (key === "rechazadas" && _planta === "perisur") return false;
  return COLUMN_KEYS.has(key);
}

function dbColumnForKey(planta: PlantaValue, uiKey: string): string | null {
  // En perisur la columna de merma tiene un nombre ligeramente distinto.
  if (planta === "perisur" && uiKey === "merma_puntas_colas_sobrantes") {
    return "merma_puntas_colas_sobrante";
  }
  // perisur no tiene columna "rechazadas".
  if (planta === "perisur" && uiKey === "rechazadas") return null;
  return uiKey;
}

export function normalizeRowFromDb(
  planta: PlantaValue,
  row: Record<string, unknown>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key } of CAPTURA_COLUMNS) {
    const dbKey = dbColumnForKey(planta, key);
    if (!dbKey) {
      out[key] = "";
      continue;
    }
    const v = row[dbKey];
    if (v === null || v === undefined) {
      out[key] = "";
    } else {
      const str = typeof v === "number" ? String(v) : String(v);
      out[key] =
        planta === "periferico" && key === "fecha"
          ? normalizePerifericoFechaToIso(str)
          : str;
    }
  }
  return out;
}

export function parseCellForDb(
  planta: PlantaValue,
  key: string,
  raw: string
): string | number | null {
  const t = raw.trim();
  if (t === "") return null;

  if (planta === "llave2") {
    if (key === "turno" || key === "cantidad_producida" || key === "no_maquina") {
      const n = parseInt(t, 10);
      return Number.isFinite(n) ? n : t;
    }
    if (key === "longitud") {
      const n = parseFloat(t.replace(",", "."));
      return Number.isFinite(n) ? n : t;
    }
  }

  if (planta === "periferico") {
    if (key === "turno") {
      const n = parseInt(t, 10);
      return Number.isFinite(n) ? n : t;
    }
    if (key === "fecha") {
      const iso = normalizePerifericoFechaToIso(t);
      return iso === "" ? null : iso;
    }
    if (key === "cantidad_producida" || key === "no_maquina" || key === "longitud") {
      return t;
    }
  }

  if (planta === "perisur") {
    if (key === "turno" || key === "cantidad_producida" || key === "no_maquina") {
      const n = parseInt(t, 10);
      return Number.isFinite(n) ? n : t;
    }
    // En perisur `longitud` y merma son text en el esquema, se guardan como texto.
    if (key === "longitud") return t;
  }

  return t;
}

export function rowToDbPayload(
  planta: PlantaValue,
  cells: Record<string, string>
): Record<string, string | number | null> {
  const payload: Record<string, string | number | null> = {};
  for (const { key } of CAPTURA_COLUMNS) {
    if (!shouldPersistColumn(planta, key)) continue;
    const raw = cells[key] ?? "";
    const dbKey = dbColumnForKey(planta, key);
    if (!dbKey) continue;
    payload[dbKey] = parseCellForDb(planta, key, raw);
  }
  return payload;
}
