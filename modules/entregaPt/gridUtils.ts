import { ENTREGA_PT_COLUMNS } from "./plantConfig";
import type { EntregaPtRowState } from "./types";

export function stableRowId(row: EntregaPtRowState): string {
  if (row.id != null) return `id:${row.id}`;
  if (row.tempId) return row.tempId;
  return `anon:${JSON.stringify(row.values).slice(0, 40)}`;
}

export function createBlankRowDeterministic(suffix: string): EntregaPtRowState {
  const values: Record<string, string> = {};
  for (const { key } of ENTREGA_PT_COLUMNS) {
    values[key] = "";
  }
  return {
    tempId: `t-blank-${suffix}`,
    values,
  };
}

export function createBlankRow(): EntregaPtRowState {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `r-${Math.random().toString(36).slice(2, 11)}`;
  return createBlankRowDeterministic(suffix);
}

export function isRowOnlyDefaultTurno(row: EntregaPtRowState): boolean {
  for (const { key } of ENTREGA_PT_COLUMNS) {
    if ((row.values[key] ?? "").trim() !== "") return false;
  }
  return true;
}

export function shouldPersistRow(row: EntregaPtRowState): boolean {
  if (row.id != null) return true;
  if (isRowOnlyDefaultTurno(row)) return false;
  return true;
}

export function orderRowsWithEmptyFechaLast(rows: EntregaPtRowState[]): EntregaPtRowState[] {
  const withFecha: EntregaPtRowState[] = [];
  const withoutFecha: EntregaPtRowState[] = [];
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

/** Igual que captura: cada palabra debe coincidir por prefijo en algún campo. */
export function rowMatchesGlobalSearch(row: EntregaPtRowState, q: string): boolean {
  const tokens = q
    .trim()
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  for (const needle of tokens) {
    const anyColumn = ENTREGA_PT_COLUMNS.some((c) => {
      const cell = (row.values[c.key] ?? "").trim().toLowerCase();
      return cell.startsWith(needle);
    });
    if (!anyColumn) return false;
  }
  return true;
}

export function findColumnSuggestion(
  rows: EntregaPtRowState[],
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

export function mergeColumnSuggestion(
  rows: EntregaPtRowState[],
  colKey: string,
  rowStableId: string,
  typed: string
): string {
  const full = findColumnSuggestion(rows, colKey, rowStableId, typed);
  if (!full) return typed;
  if (!full.toLowerCase().startsWith(typed.toLowerCase())) return typed;
  return full;
}

const TRAILING_INT_RE = /^(.*?)(\d+)$/;

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
