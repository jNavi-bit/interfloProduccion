import { CAPTURA_COLUMNS } from "./plantConfig";
import type { ProduccionRowState } from "./types";

export function stableRowId(row: ProduccionRowState): string {
  if (row.id != null) return `id:${row.id}`;
  if (row.tempId) return row.tempId;
  return `anon:${JSON.stringify(row.values).slice(0, 40)}`;
}

/** IDs estables entre SSR y cliente; usar en el primer render (p. ej. filas vacías iniciales). */
export function createBlankRowDeterministic(suffix: string): ProduccionRowState {
  const values: Record<string, string> = {};
  for (const { key } of CAPTURA_COLUMNS) {
    values[key] = "";
  }
  return {
    tempId: `t-blank-${suffix}`,
    values,
  };
}

/** Solo en el cliente tras hidratar o en interacción (evita mismatch de hidratación). */
export function createBlankRow(): ProduccionRowState {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `r-${Math.random().toString(36).slice(2, 11)}`;
  return createBlankRowDeterministic(suffix);
}

/** Fila sin ningún valor (solo espacios); no se persiste en BD si no tiene `id`. */
export function isRowOnlyDefaultTurno(row: ProduccionRowState): boolean {
  for (const { key } of CAPTURA_COLUMNS) {
    if ((row.values[key] ?? "").trim() !== "") return false;
  }
  return true;
}

export function shouldPersistRow(row: ProduccionRowState): boolean {
  if (row.id != null) return true;
  if (isRowOnlyDefaultTurno(row)) return false;
  return true;
}

/**
 * Orden de vista: filas con `fecha` no vacía primero (`fecha` asc, `id` asc),
 * luego las de `fecha` vacía (mismo orden relativo que en el array para esas filas).
 */
export function orderRowsWithEmptyFechaLast(rows: ProduccionRowState[]): ProduccionRowState[] {
  const withFecha: ProduccionRowState[] = [];
  const withoutFecha: ProduccionRowState[] = [];
  for (const r of rows) {
    if ((r.values.fecha ?? "").trim() === "") withoutFecha.push(r);
    else withFecha.push(r);
  }
  withFecha.sort((a, b) => {
    const fa = (a.values.fecha ?? "").trim();
    const fb = (b.values.fecha ?? "").trim();
    const cmp = fa.localeCompare(fb);
    if (cmp !== 0) return cmp;
    const ia = a.id != null ? a.id : Number.MAX_SAFE_INTEGER;
    const ib = b.id != null ? b.id : Number.MAX_SAFE_INTEGER;
    if (ia !== ib) return ia - ib;
    return stableRowId(a).localeCompare(stableRowId(b));
  });
  return [...withFecha, ...withoutFecha];
}

export function rowMatchesGlobalSearch(
  row: ProduccionRowState,
  q: string
): boolean {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  const hay = CAPTURA_COLUMNS.map((c) => (row.values[c.key] ?? "").toLowerCase()).join(
    "\u0000"
  );
  return hay.includes(needle);
}

export function rowMatchesColumnFilters(
  row: ProduccionRowState,
  filters: Record<string, Set<string> | null>
): boolean {
  for (const { key } of CAPTURA_COLUMNS) {
    const allowed = filters[key];
    if (allowed === null) continue;
    if (allowed.size === 0) return false;
    const cell = (row.values[key] ?? "").trim();
    const display = cell === "" ? "(Vacío)" : cell;
    if (!allowed.has(display)) return false;
  }
  return true;
}

export function distinctColumnValues(rows: ProduccionRowState[], colKey: string): string[] {
  const s = new Set<string>();
  for (const row of rows) {
    const cell = (row.values[colKey] ?? "").trim();
    s.add(cell === "" ? "(Vacío)" : cell);
  }
  return [...s].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

export function findColumnSuggestion(
  rows: ProduccionRowState[],
  colKey: string,
  rowStableId: string,
  typed: string
): string | null {
  const prefix = typed.toLowerCase();
  if (prefix === "") return null;
  const candidates = new Set<string>();
  for (const row of rows) {
    if (stableRowId(row) === rowStableId) continue;
    const v = (row.values[colKey] ?? "").trim();
    if (!v) continue;
    if (v.toLowerCase().startsWith(prefix) && v.length > typed.length) {
      candidates.add(v);
    }
  }
  if (candidates.size === 0) return null;
  return [...candidates].sort((a, b) => a.length - b.length)[0] ?? null;
}

/** Sustituye `typed` por la sugerencia completa si aplica (misma columna / prefijo). */
export function mergeColumnSuggestion(
  rows: ProduccionRowState[],
  colKey: string,
  rowStableId: string,
  typed: string
): string {
  const full = findColumnSuggestion(rows, colKey, rowStableId, typed);
  if (!full) return typed;
  if (!full.toLowerCase().startsWith(typed.toLowerCase())) return typed;
  return full;
}

/** Sufijo numérico final (entero) para relleno tipo Excel. */
const TRAILING_INT_RE = /^(.*?)(\d+)$/;

/**
 * Relleno desde `source`: si termina en dígitos, suma `step` al entero final;
 * si no, devuelve `source` (copia en todas las celdas).
 * `step` ≥ 1 para la 1.ª celda rellenada, 2 para la siguiente, etc.
 */
export function fillValueForStep(source: string, step: number): string {
  const m = source.match(TRAILING_INT_RE);
  if (!m) return source;
  const prefix = m[1];
  const numStr = m[2];
  const n = parseInt(numStr, 10);
  if (!Number.isFinite(n)) return source;
  const next = n + step;
  let nextStr = String(next);
  if (nextStr.length < numStr.length) {
    nextStr = nextStr.padStart(numStr.length, "0");
  }
  return prefix + nextStr;
}

/**
 * Celdas a rellenar desde la esquina de origen `(brDr, brDc)` hasta `(endDr, endDc)`,
 * en una sola dirección (eje dominante), sin incluir el origen.
 */
export function computeFillTargetCells(
  brDr: number,
  brDc: number,
  endDr: number,
  endDc: number,
  maxDr: number,
  maxDc: number
): { dr: number; dc: number }[] {
  const dRow = endDr - brDr;
  const dCol = endDc - brDc;
  if (dRow === 0 && dCol === 0) return [];

  const targets: { dr: number; dc: number }[] = [];

  if (Math.abs(dRow) >= Math.abs(dCol)) {
    const e = Math.max(0, Math.min(maxDr, endDr));
    if (e > brDr) {
      for (let r = brDr + 1; r <= e; r++) targets.push({ dr: r, dc: brDc });
    } else if (e < brDr) {
      for (let r = brDr - 1; r >= e; r--) targets.push({ dr: r, dc: brDc });
    }
  } else {
    const e = Math.max(0, Math.min(maxDc, endDc));
    if (e > brDc) {
      for (let c = brDc + 1; c <= e; c++) targets.push({ dr: brDr, dc: c });
    } else if (e < brDc) {
      for (let c = brDc - 1; c >= e; c--) targets.push({ dr: brDr, dc: c });
    }
  }

  return targets;
}
