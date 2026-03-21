import type { PlantaValue } from "@/modules/dashboard/plants";
import { normalizePerifericoFechaToIso } from "@/modules/captura/plantConfig";

export const PROD_TERMINADO_TABLE: Record<PlantaValue, string> = {
  llave2: "prodTerminadoLlave2",
  periferico: "prodTerminadoPeriferico",
  perisur: "prodTerminadoPerisur",
};

export interface EntregaPtColumn {
  key: string;
  label: string;
  minWidth?: number;
}

/** Columnas alineadas con `prodTerminado*` (sin `id` ni `no_registro`). */
export const ENTREGA_PT_COLUMNS: EntregaPtColumn[] = [
  { key: "py", label: "PY", minWidth: 100 },
  { key: "orden", label: "Orden", minWidth: 120 },
  { key: "cliente", label: "Cliente", minWidth: 160 },
  { key: "descripcion", label: "Descripción", minWidth: 200 },
  { key: "color", label: "Color", minWidth: 100 },
  { key: "cantidad_fabricada", label: "Cant. fabricada", minWidth: 120 },
  { key: "turno", label: "Turno", minWidth: 72 },
  { key: "fecha", label: "Fecha", minWidth: 110 },
  { key: "lider", label: "Líder", minWidth: 120 },
  { key: "equipo", label: "Equipo", minWidth: 120 },
  { key: "recibio", label: "Recibió", minWidth: 120 },
  { key: "comentarios", label: "Comentarios", minWidth: 180 },
];

const COLUMN_KEYS = new Set(ENTREGA_PT_COLUMNS.map((c) => c.key));

export function columnIndex(key: string): number {
  return ENTREGA_PT_COLUMNS.findIndex((c) => c.key === key);
}

export function shouldPersistColumn(_planta: PlantaValue, key: string): boolean {
  return COLUMN_KEYS.has(key);
}

export function normalizeRowFromDb(
  _planta: PlantaValue,
  row: Record<string, unknown>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key } of ENTREGA_PT_COLUMNS) {
    const v = row[key];
    if (v === null || v === undefined) {
      out[key] = "";
    } else {
      const str = typeof v === "number" ? String(v) : String(v);
      out[key] = key === "fecha" ? normalizePerifericoFechaToIso(str) : str;
    }
  }
  return out;
}

export function parseCellForDb(
  _planta: PlantaValue,
  key: string,
  raw: string
): string | number | null {
  const t = raw.trim();
  if (t === "") return null;

  if (key === "turno" || key === "cantidad_fabricada") {
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : t;
  }
  if (key === "fecha") {
    const iso = normalizePerifericoFechaToIso(t);
    return iso === "" ? null : iso;
  }

  return t;
}

export function rowToDbPayload(
  planta: PlantaValue,
  cells: Record<string, string>
): Record<string, string | number | null> {
  const payload: Record<string, string | number | null> = {};
  for (const { key } of ENTREGA_PT_COLUMNS) {
    if (!shouldPersistColumn(planta, key)) continue;
    const raw = cells[key] ?? "";
    payload[key] = parseCellForDb(planta, key, raw);
  }
  return payload;
}
