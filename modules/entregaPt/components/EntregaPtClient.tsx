"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Input } from "@heroui/react";
import {
  Filter,
  FilterX,
  Search,
  AlertCircle,
  CheckCircle2,
  ImageUp,
  FileSpreadsheet,
} from "lucide-react";
import { vividFieldClassNames } from "@/lib/heroUiVivid";
import { downloadExcelWorkbook } from "@/lib/excelExport";
import { createClient } from "@/database/utils/supabase/client";
import { PLANTA_OPTIONS, type PlantaValue } from "@/modules/dashboard/plants";
import {
  ENTREGA_PT_COLUMNS,
  columnIndex,
  PROD_TERMINADO_TABLE,
} from "@/modules/entregaPt/plantConfig";
import type { EntregaPtRowState } from "@/modules/entregaPt/types";
import {
  stableRowId,
  createBlankRow,
  createBlankRowDeterministic,
  shouldPersistRow,
  isRowOnlyDefaultTurno,
  orderRowsWithEmptyFechaLast,
  rowMatchesGlobalSearch,
  rowMatchesColumnFilters,
  distinctColumnValues,
  findColumnSuggestion,
  mergeColumnSuggestion,
  computeFillTargetCells,
  fillValueForStep,
} from "@/modules/entregaPt/gridUtils";
import {
  saveEntregaPtRow,
  loadEntregaPtRowsOlder,
  deleteEntregaPtRowsInChunks,
  reloadEntregaPtSnapshot,
  fetchAllEntregaPtRowsForExcel,
} from "@/modules/entregaPt/actions";

interface EntregaPtClientProps {
  planta: PlantaValue;
  initialRows: EntregaPtRowState[];
  initialHasMoreOlder: boolean;
}

const TRAILING_EMPTY = 5;
const UNDO_MAX = 45;
const SAVE_DEBOUNCE_MS = 480;
const PAGE_SIZE = 60;

/** Ancho fijo de la columna de número de fila (solo visual, no forma parte de ENTREGA_PT_COLUMNS). */
const ROW_NUM_COL_PX = 40;

function defaultColumnWidths(): Record<string, number> {
  return Object.fromEntries(
    ENTREGA_PT_COLUMNS.map((c) => [c.key, c.minWidth ?? 96])
  ) as Record<string, number>;
}

function cloneRows(r: EntregaPtRowState[]): EntregaPtRowState[] {
  return r.map((row) => ({
    id: row.id,
    tempId: row.tempId,
    noRegistro: row.noRegistro,
    values: { ...row.values },
  }));
}

function buildInitialRowsState(ir: EntregaPtRowState[]): EntregaPtRowState[] {
  const base = cloneRows(ir);
  const trailing = Array.from({ length: TRAILING_EMPTY }, (_, i) =>
    createBlankRowDeterministic(`init-${i}`)
  );
  return [...base, ...trailing];
}

function mergeEntregaPtDbExportWithLocal(
  fromDb: EntregaPtRowState[],
  localRows: EntregaPtRowState[]
): EntregaPtRowState[] {
  const clientById = new Map<number, EntregaPtRowState>();
  for (const r of localRows) {
    if (r.id != null) clientById.set(r.id, r);
  }
  const merged = fromDb.map((dbRow) => {
    if (dbRow.id == null) return dbRow;
    return clientById.get(dbRow.id) ?? dbRow;
  });
  const unsaved = localRows.filter((r) => r.id == null && shouldPersistRow(r));
  return [...merged, ...unsaved];
}

function cellKey(rowId: string, colKey: string): string {
  return `${rowId}\t${colKey}`;
}

function parseCellKey(k: string): { rowId: string; colKey: string } {
  const i = k.indexOf("\t");
  return { rowId: k.slice(0, i), colKey: k.slice(i + 1) };
}

/** Clave de `scheduleSave`: `id:<n>` o `tempId` de la fila. */
function findRowBySaveKey(
  rowList: EntregaPtRowState[],
  saveKey: string
): EntregaPtRowState | undefined {
  if (saveKey.startsWith("id:")) {
    const id = Number(saveKey.slice(3));
    if (!Number.isFinite(id)) return undefined;
    return rowList.find((r) => r.id === id);
  }
  return rowList.find((r) => r.tempId === saveKey);
}

function rowValuesEqual(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  for (const { key } of ENTREGA_PT_COLUMNS) {
    if ((a[key] ?? "") !== (b[key] ?? "")) return false;
  }
  return true;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo abrir la imagen seleccionada."));
    img.src = dataUrl;
  });
}

async function imageFileToOptimizedDataUrl(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  const img = await loadImage(original);

  const MAX_SIDE = 1700;
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  if (scale >= 1) return original;

  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function mapRowsByDbId(rows: EntregaPtRowState[]): Map<number, EntregaPtRowState> {
  const m = new Map<number, EntregaPtRowState>();
  for (const r of rows) {
    if (r.id != null) m.set(r.id, r);
  }
  return m;
}

function selectionDataCellCoords(
  selected: Set<string>,
  displayRows: EntregaPtRowState[]
): { dr: number; dc: number }[] {
  const rowIdToDr = new Map<string, number>();
  displayRows.forEach((row, dr) => rowIdToDr.set(stableRowId(row), dr));
  const out: { dr: number; dc: number }[] = [];
  for (const k of selected) {
    const { rowId, colKey } = parseCellKey(k);
    const dr = rowIdToDr.get(rowId);
    const dc = columnIndex(colKey);
    if (dr === undefined || dc < 0) continue;
    out.push({ dr, dc });
  }
  return out;
}

function bottomRightSelectedCell(
  coords: { dr: number; dc: number }[]
): { dr: number; dc: number } | null {
  if (coords.length === 0) return null;
  return coords.reduce((a, b) =>
    b.dr > a.dr || (b.dr === a.dr && b.dc > a.dc) ? b : a
  );
}

/** Tab / salto de línea / comillas en un campo para pegar bien en Excel. */
function escapeCellForTsv(s: string): string {
  const t = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[\t\n"]/.test(t)) {
    return `"${t.replace(/"/g, '""')}"`;
  }
  return t;
}

function selectionToTsv(
  selected: Set<string>,
  displayRows: EntregaPtRowState[]
): string {
  const rowIdToDr = new Map<string, number>();
  displayRows.forEach((row, dr) => {
    rowIdToDr.set(stableRowId(row), dr);
  });

  const cells: { dr: number; dc: number; val: string }[] = [];
  for (const k of selected) {
    const { rowId, colKey } = parseCellKey(k);
    const dr = rowIdToDr.get(rowId);
    if (dr === undefined) continue;
    const dc = columnIndex(colKey);
    if (dc < 0) continue;
    const row = displayRows[dr];
    if (!row) continue;
    cells.push({ dr, dc, val: row.values[colKey] ?? "" });
  }
  cells.sort((a, b) => (a.dr !== b.dr ? a.dr - b.dr : a.dc - b.dc));

  const lines: string[] = [];
  let curDr = -1;
  let curParts: string[] = [];
  for (const c of cells) {
    if (c.dr !== curDr) {
      if (curDr >= 0) lines.push(curParts.join("\t"));
      curDr = c.dr;
      curParts = [escapeCellForTsv(c.val)];
    } else {
      curParts.push(escapeCellForTsv(c.val));
    }
  }
  if (curDr >= 0) lines.push(curParts.join("\t"));
  return lines.join("\n");
}

function parseTsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === "\t") {
      out.push(cur);
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  out.push(cur);
  return out;
}

function parseClipboardTsv(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalized.split("\n");
  while (rawLines.length > 0 && rawLines[rawLines.length - 1] === "") {
    rawLines.pop();
  }
  if (rawLines.length === 0) return [];
  return rawLines.map((line) => parseTsvLine(line));
}

function applyCapturaFilters(
  rowList: EntregaPtRowState[],
  globalSearch: string,
  columnFilters: Record<string, Set<string> | null>
): EntregaPtRowState[] {
  return rowList.filter(
    (row) =>
      rowMatchesGlobalSearch(row, globalSearch) &&
      rowMatchesColumnFilters(row, columnFilters)
  );
}

function applyCapturaFiltersOnDisplayOrder(
  rowList: EntregaPtRowState[],
  globalSearch: string,
  columnFilters: Record<string, Set<string> | null>
): EntregaPtRowState[] {
  return applyCapturaFilters(
    orderRowsWithEmptyFechaLast(rowList),
    globalSearch,
    columnFilters
  );
}

function entregaFiltersActive(
  globalSearch: string,
  columnFilters: Record<string, Set<string> | null>
): boolean {
  if (globalSearch.trim() !== "") return true;
  for (const { key } of ENTREGA_PT_COLUMNS) {
    if (columnFilters[key] !== null) return true;
  }
  return false;
}

export function EntregaPtClient({
  planta,
  initialRows,
  initialHasMoreOlder,
}: EntregaPtClientProps) {
  const [rows, setRows] = useState<EntregaPtRowState[]>(() =>
    buildInitialRowsState(initialRows)
  );

  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const [hasMoreOlder, setHasMoreOlder] = useState<boolean>(initialHasMoreOlder);
  const [loadingMore, setLoadingMore] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string> | null>>(
    () => {
      const o: Record<string, Set<string> | null> = {};
      for (const { key } of ENTREGA_PT_COLUMNS) o[key] = null;
      return o;
    }
  );

  const [filterOpenCol, setFilterOpenCol] = useState<string | null>(null);

  const filtersActive = useMemo(
    () => entregaFiltersActive(globalSearch, columnFilters),
    [globalSearch, columnFilters]
  );
  const needsFullDataset = useMemo(
    () => filtersActive || filterOpenCol !== null,
    [filtersActive, filterOpenCol]
  );
  const needsFullDatasetRef = useRef(false);
  useEffect(() => {
    needsFullDatasetRef.current = needsFullDataset;
  }, [needsFullDataset]);
  const prevNeedsFullDatasetRef = useRef<boolean | null>(null);
  const [filterDatasetLoading, setFilterDatasetLoading] = useState(false);

  const clearAllAppliedFilters = useCallback(() => {
    setGlobalSearch("");
    setFilterOpenCol(null);
    setColumnFilters(() => {
      const o: Record<string, Set<string> | null> = {};
      for (const { key } of ENTREGA_PT_COLUMNS) o[key] = null;
      return o;
    });
  }, []);

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const anchorRef = useRef<{ dr: number; dc: number }>({ dr: 0, dc: 0 });
  const [focus, setFocus] = useState<{ dr: number; dc: number }>({ dr: 0, dc: 0 });
  const focusRef = useRef(focus);
  focusRef.current = focus;

  /** Último clic dentro de la grilla (por si el foco no llega al `div` con tabIndex). */
  const lastPointerInsideGridRef = useRef(false);

  const [editing, setEditing] = useState<{ dr: number; dc: number } | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const editBufferRef = useRef("");
  editBufferRef.current = editBuffer;
  const editingRef = useRef<typeof editing>(null);
  editingRef.current = editing;

  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [importingImage, setImportingImage] = useState(false);
  const [exportExcelLoading, setExportExcelLoading] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  /** Realtime llegó durante edición: refrescar al cerrar la celda. */
  const pendingRemoteReloadRef = useRef(false);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const undoStack = useRef<EntregaPtRowState[][]>([]);
  const redoStack = useRef<EntregaPtRowState[][]>([]);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipBlurCommitRef = useRef(false);
  /** Arrastre con botón izquierdo para selección rectangular (desde `anchorRef`). */
  const isSelectDraggingRef = useRef(false);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultColumnWidths);
  const columnWidthsRef = useRef(columnWidths);
  columnWidthsRef.current = columnWidths;
  const columnResizeRef = useRef<{
    key: string;
    startX: number;
    startW: number;
    minW: number;
  } | null>(null);

  const globalSearchRef = useRef(globalSearch);
  globalSearchRef.current = globalSearch;
  const columnFiltersRef = useRef(columnFilters);
  columnFiltersRef.current = columnFilters;

  /** Arrastre de relleno tipo Excel (no extender selección con mouse). */
  const isFillDraggingRef = useRef(false);
  const [fillPreviewKeys, setFillPreviewKeys] = useState<Set<string> | null>(null);

  const displayRows = useMemo(
    () => applyCapturaFiltersOnDisplayOrder(rows, globalSearch, columnFilters),
    [rows, globalSearch, columnFilters]
  );

  const fillAnchor = useMemo(() => {
    if (editing != null) return null;
    const coords = selectionDataCellCoords(selected, displayRows);
    const br = bottomRightSelectedCell(coords);
    if (!br) return null;
    const row = displayRows[br.dr];
    if (!row) return null;
    const col = ENTREGA_PT_COLUMNS[br.dc];
    if (!col) return null;
    return {
      dr: br.dr,
      dc: br.dc,
      source: row.values[col.key] ?? "",
      colKey: col.key,
    };
  }, [selected, displayRows, editing]);

  /**
   * Número de registro: `no_registro` de BD para filas guardadas; borradores sin id muestran
   * números provisionales después del máximo `no_registro` ya cargado.
   */
  const rowNumByStableId = useMemo(() => {
    const m = new Map<string, number>();
    const ordered = orderRowsWithEmptyFechaLast(rows);
    let maxNo = 0;
    for (const r of ordered) {
      if (r.noRegistro != null && r.noRegistro > maxNo) maxNo = r.noRegistro;
    }
    let draftSeq = 0;
    for (const row of ordered) {
      if (row.id != null && row.noRegistro != null) {
        m.set(stableRowId(row), row.noRegistro);
      } else if (!isRowOnlyDefaultTurno(row)) {
        draftSeq += 1;
        m.set(stableRowId(row), maxNo + draftSeq);
      }
    }
    return m;
  }, [rows]);

  const exportToExcel = useCallback(async () => {
    setExportExcelLoading(true);
    setSaveBanner(null);
    try {
      const res = await fetchAllEntregaPtRowsForExcel(planta);
      if (!res.ok) {
        setSaveBanner(`Exportación Excel: ${res.error}`);
        return;
      }
      const toExport = mergeEntregaPtDbExportWithLocal(res.rows, rows);
      if (toExport.length === 0) {
        setSaveBanner("No hay filas para exportar.");
        return;
      }
      const headers = ["No. registro", ...ENTREGA_PT_COLUMNS.map((c) => c.label)];
      const aoa: (string | number)[][] = [headers];
      for (const row of toExport) {
        const rowId = stableRowId(row);
        const nr = row.noRegistro ?? rowNumByStableId.get(rowId);
        aoa.push([
          nr != null ? nr : "",
          ...ENTREGA_PT_COLUMNS.map((c) => row.values[c.key] ?? ""),
        ]);
      }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadExcelWorkbook(`entrega-pt-${planta}-${stamp}`, [{ name: "Entrega PT", rows: aoa }]);
    } finally {
      setExportExcelLoading(false);
    }
  }, [planta, rows, rowNumByStableId]);

  const clearAllSaveTimers = useCallback(() => {
    for (const t of saveTimers.current.values()) clearTimeout(t);
    saveTimers.current.clear();
  }, []);

  /** Tras deshacer/rehacer: borra en BD los ids que ya no existen y actualiza filas con datos distintos. */
  const syncDbAfterHistoryStep = useCallback(
    async (fromRows: EntregaPtRowState[], toRows: EntregaPtRowState[]) => {
      const fromMap = mapRowsByDbId(fromRows);
      const toMap = mapRowsByDbId(toRows);

      const toDelete: number[] = [];
      for (const id of fromMap.keys()) {
        if (!toMap.has(id)) toDelete.push(id);
      }

      if (toDelete.length > 0) {
        const delRes = await deleteEntregaPtRowsInChunks(planta, toDelete);
        if (!delRes.ok) {
          setSaveBanner(delRes.error);
          return;
        }
      }

      for (const [id, row] of toMap) {
        const fromRow = fromMap.get(id);
        if (fromRow && rowValuesEqual(fromRow.values, row.values)) continue;
        const res = await saveEntregaPtRow(planta, { id, values: row.values });
        if (!res.ok) {
          setSaveBanner(res.error);
          return;
        }
      }
      setSaveBanner(null);
    },
    [planta]
  );

  const pushUndo = useCallback(() => {
    undoStack.current.push(cloneRows(rowsRef.current));
    if (undoStack.current.length > UNDO_MAX) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const applyRows = useCallback((next: EntregaPtRowState[]) => {
    setRows(next);
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(cloneRows(rowsRef.current));
    const fromRows = cloneRows(rowsRef.current);
    clearAllSaveTimers();
    setRows(prev);
    setEditing(null);
    setSelected(new Set());
    void syncDbAfterHistoryStep(fromRows, prev);
  }, [clearAllSaveTimers, syncDbAfterHistoryStep]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(cloneRows(rowsRef.current));
    const fromRows = cloneRows(rowsRef.current);
    clearAllSaveTimers();
    setRows(next);
    setEditing(null);
    setSelected(new Set());
    void syncDbAfterHistoryStep(fromRows, next);
  }, [clearAllSaveTimers, syncDbAfterHistoryStep]);

  const ensureTrailing = useCallback((list: EntregaPtRowState[]) => {
    let trailing = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].id != null || !isRowOnlyDefaultTurno(list[i])) break;
      trailing++;
    }
    const need = TRAILING_EMPTY - trailing;
    if (need <= 0) return list;
    const extra = Array.from({ length: need }, () => createBlankRow());
    return [...list, ...extra];
  }, []);

  useEffect(() => {
    const prev = prevNeedsFullDatasetRef.current;

    if (!needsFullDataset) {
      prevNeedsFullDatasetRef.current = false;
      if (prev === true) {
        let cancelled = false;
        void (async () => {
          setFilterDatasetLoading(true);
          clearAllSaveTimers();
          try {
            const snap = await reloadEntregaPtSnapshot(planta, PAGE_SIZE + 1);
            if (cancelled) return;
            setHasMoreOlder(snap.hasMoreOlder);
            undoStack.current = [];
            redoStack.current = [];
            setEditing(null);
            setSelected(new Set());
            setRows(ensureTrailing(orderRowsWithEmptyFechaLast(cloneRows(snap.rows))));
            requestAnimationFrame(() => {
              const sc = scrollRef.current;
              if (sc) sc.scrollTop = sc.scrollHeight;
            });
          } catch {
            if (!cancelled) {
              setSaveBanner("No se pudo restaurar la vista al quitar filtros.");
              setTimeout(() => setSaveBanner(null), 5000);
            }
          } finally {
            if (!cancelled) setFilterDatasetLoading(false);
          }
        })();
        return () => {
          cancelled = true;
        };
      }
      return;
    }

    prevNeedsFullDatasetRef.current = true;
    setFilterDatasetLoading(true);
    let cancelled = false;
    const debounceMs = filterOpenCol !== null ? 0 : 350;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetchAllEntregaPtRowsForExcel(planta);
          if (cancelled) return;
          if (!res.ok) {
            setSaveBanner(`Búsqueda/filtros: ${res.error}`);
            return;
          }
          setSaveBanner(null);
          setRows((prevRows) =>
            ensureTrailing(
              orderRowsWithEmptyFechaLast(
                mergeEntregaPtDbExportWithLocal(res.rows, prevRows)
              )
            )
          );
          setHasMoreOlder(false);
        } finally {
          if (!cancelled) setFilterDatasetLoading(false);
        }
      })();
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setFilterDatasetLoading(false);
    };
  }, [needsFullDataset, filterOpenCol, planta, clearAllSaveTimers, ensureTrailing]);

  const reloadFromDb = useCallback(async () => {
    if (editingRef.current) {
      pendingRemoteReloadRef.current = true;
      return;
    }
    clearAllSaveTimers();
    try {
      if (needsFullDatasetRef.current) {
        const res = await fetchAllEntregaPtRowsForExcel(planta);
        if (!res.ok) {
          setSaveBanner(res.error);
          setTimeout(() => setSaveBanner(null), 5000);
          return;
        }
        setHasMoreOlder(false);
        undoStack.current = [];
        redoStack.current = [];
        setEditing(null);
        setSelected(new Set());
        setInfoBanner(null);
        setSaveBanner(null);
        setRows((prev) =>
          ensureTrailing(
            orderRowsWithEmptyFechaLast(mergeEntregaPtDbExportWithLocal(res.rows, prev))
          )
        );
        return;
      }

      const snap = await reloadEntregaPtSnapshot(planta, PAGE_SIZE + 1);
      setHasMoreOlder(snap.hasMoreOlder);
      undoStack.current = [];
      redoStack.current = [];
      setEditing(null);
      setSelected(new Set());
      setInfoBanner(null);
      setSaveBanner(null);
      setRows(ensureTrailing(orderRowsWithEmptyFechaLast(cloneRows(snap.rows))));
      requestAnimationFrame(() => {
        const sc = scrollRef.current;
        if (sc) sc.scrollTop = sc.scrollHeight;
      });
    } catch {
      setSaveBanner("No se pudo refrescar la tabla desde la base de datos.");
      setTimeout(() => setSaveBanner(null), 5000);
    }
  }, [planta, clearAllSaveTimers, ensureTrailing]);

  /** Tras cerrar edición, aplica un refresco pendiente por Realtime. */
  useEffect(() => {
    if (editing != null) return;
    if (!pendingRemoteReloadRef.current) return;
    pendingRemoteReloadRef.current = false;
    void reloadFromDb();
  }, [editing, reloadFromDb]);

  /**
   * Recarga la ventana de captura cuando hay INSERT/UPDATE/DELETE en la tabla de la planta.
   * Requiere habilitar Realtime (replicación) para esa tabla en Supabase → Database → Publications.
   */
  useEffect(() => {
    const supabase = createClient();
    const table = PROD_TERMINADO_TABLE[planta];
    const schedule = () => {
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      realtimeDebounceRef.current = setTimeout(() => {
        realtimeDebounceRef.current = null;
        void reloadFromDb();
      }, 550);
    };

    const channel = supabase
      .channel(`entrega-pt-db-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        schedule
      )
      .subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [planta, reloadFromDb]);

  const loadOlderRows = useCallback(async () => {
    if (needsFullDatasetRef.current || !hasMoreOlder || loadingMore) return;

    const el = scrollRef.current;
    const beforeScrollHeight = el?.scrollHeight ?? 0;
    const beforeScrollTop = el?.scrollTop ?? 0;

    const firstPersisted = orderRowsWithEmptyFechaLast(rowsRef.current).find(
      (r) => r.id != null
    );
    if (firstPersisted?.id == null) return;

    setLoadingMore(true);

    try {
      const res = await loadEntregaPtRowsOlder(
        planta,
        {
          beforeFecha: firstPersisted.values.fecha ?? "",
          beforeId: firstPersisted.id,
        },
        PAGE_SIZE
      );

      setHasMoreOlder(res.hasMoreOlder);

      if (res.rows.length === 0) return;

      setRows((prev) => {
        let trailing = 0;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].id != null || !isRowOnlyDefaultTurno(prev[i])) break;
          trailing++;
        }

        const base = prev.slice(0, prev.length - trailing);
        return ensureTrailing(orderRowsWithEmptyFechaLast([...res.rows, ...base]));
      });

      requestAnimationFrame(() => {
        const sc = scrollRef.current;
        if (!sc) return;
        const delta = sc.scrollHeight - beforeScrollHeight;
        sc.scrollTop = beforeScrollTop + delta;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreOlder, loadingMore, planta, ensureTrailing]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollTop < 260) {
      void loadOlderRows();
    }
  }, [loadOlderRows]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const persistRowBySaveKeyRef = useRef<(key: string) => Promise<boolean>>(async () => true);

  const persistRowBySaveKey = useCallback(
    async (saveKey: string): Promise<boolean> => {
      const latest = findRowBySaveKey(rowsRef.current, saveKey);
      if (!latest || !shouldPersistRow(latest)) return true;
      const res = await saveEntregaPtRow(planta, {
        id: latest.id,
        values: latest.values,
      });
      if (!res.ok) {
        setSaveBanner(res.error);
        return false;
      }
      setSaveBanner(null);
      setRows((prev) => {
        const idx = prev.findIndex(
          (r) =>
            (latest.id != null && r.id === latest.id) ||
            (latest.tempId != null && r.tempId === latest.tempId)
        );
        if (idx < 0) return prev;
        const copy = [...prev];
        const cur = copy[idx];
        if (!cur.id && res.id) {
          copy[idx] = {
            ...cur,
            id: res.id,
            tempId: undefined,
            noRegistro: res.noRegistro ?? cur.noRegistro,
          };
        }
        return ensureTrailing(copy);
      });
      return true;
    },
    [planta, ensureTrailing]
  );

  persistRowBySaveKeyRef.current = persistRowBySaveKey;

  const scheduleSave = useCallback((row: EntregaPtRowState) => {
    if (!shouldPersistRow(row)) return;
    const key = row.id != null ? `id:${row.id}` : row.tempId ?? "";
    if (!key) return;
    const t = saveTimers.current.get(key);
    if (t) clearTimeout(t);
    saveTimers.current.set(
      key,
      setTimeout(() => {
        saveTimers.current.delete(key);
        void persistRowBySaveKeyRef.current(key);
      }, SAVE_DEBOUNCE_MS)
    );
  }, []);

  const openImportPicker = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImportImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setSaveBanner("Selecciona un archivo de imagen válido.");
        return;
      }

      setImportingImage(true);
      setSaveBanner(null);

      try {
        const imageDataUrl = await imageFileToOptimizedDataUrl(file);
        const res = await fetch("/api/entrega-pt-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl, planta }),
        });
        const data = (await res.json()) as {
          rows?: Record<string, unknown>[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "No se pudo analizar la imagen.");
        }

        const sourceRows = Array.isArray(data.rows) ? data.rows : [];
        if (sourceRows.length === 0) {
          setSaveBanner("No se detectaron filas con datos en la imagen.");
          return;
        }

        const importedRows: EntregaPtRowState[] = [];
        for (const src of sourceRows) {
          const base = createBlankRow();
          const values = { ...base.values };
          for (const { key } of ENTREGA_PT_COLUMNS) {
            const raw = src[key];
            if (raw == null) {
              values[key] = "";
            } else {
              values[key] = String(raw).trim();
            }
          }
          const row: EntregaPtRowState = { ...base, values };
          if (!isRowOnlyDefaultTurno(row)) importedRows.push(row);
        }

        if (importedRows.length === 0) {
          setSaveBanner("La lectura terminó sin celdas útiles para cargar.");
          return;
        }

        pushUndo();
        setRows((prev) => {
          let trailing = 0;
          for (let i = prev.length - 1; i >= 0; i--) {
            if (prev[i].id != null || !isRowOnlyDefaultTurno(prev[i])) break;
            trailing++;
          }
          const base = prev.slice(0, prev.length - trailing);
          return ensureTrailing(orderRowsWithEmptyFechaLast([...base, ...importedRows]));
        });

        for (const row of importedRows) {
          scheduleSave(row);
        }

        setInfoBanner(`Se importaron ${importedRows.length} filas desde la imagen.`);
        setTimeout(() => setInfoBanner(null), 3500);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo procesar la imagen.";
        setSaveBanner(message);
      } finally {
        setImportingImage(false);
      }
    },
    [planta, ensureTrailing, pushUndo, scheduleSave]
  );

  const commitEdit = useCallback(
    (dr: number, dc: number, value: string) => {
      const row = displayRows[dr];
      if (!row) return;
      const col = ENTREGA_PT_COLUMNS[dc];
      if (!col) return;
      const rowId = stableRowId(row);

      pushUndo();
      setRows((prev) => {
        const idx = prev.findIndex((r) => stableRowId(r) === rowId);
        if (idx < 0) return prev;
        const copy = [...prev];
        const nextValues = { ...copy[idx].values, [col.key]: value };
        copy[idx] = { ...copy[idx], values: nextValues };
        const nextRow = copy[idx];
        scheduleSave(nextRow);
        return ensureTrailing(copy);
      });
    },
    [displayRows, pushUndo, ensureTrailing, scheduleSave]
  );

  const beginFillDrag = useCallback(
    (e: React.PointerEvent, brDr: number, brDc: number, source: string) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      const cur = editingRef.current;
      if (cur) {
        skipBlurCommitRef.current = true;
        commitEdit(cur.dr, cur.dc, editBufferRef.current);
        setEditing(null);
        setEditBuffer("");
        queueMicrotask(() => {
          skipBlurCommitRef.current = false;
        });
      }

      isSelectDraggingRef.current = false;
      isFillDraggingRef.current = true;
      let lastEndDr = brDr;
      let lastEndDc = brDc;

      const previewFor = (endDr: number, endDc: number) => {
        const disp = applyCapturaFiltersOnDisplayOrder(
          rowsRef.current,
          globalSearchRef.current,
          columnFiltersRef.current
        );
        const maxR = disp.length - 1;
        const maxC = ENTREGA_PT_COLUMNS.length - 1;
        const targets = computeFillTargetCells(brDr, brDc, endDr, endDc, maxR, maxC);
        const keys = new Set<string>();
        for (const t of targets) {
          const row = disp[t.dr];
          if (!row) continue;
          keys.add(cellKey(stableRowId(row), ENTREGA_PT_COLUMNS[t.dc].key));
        }
        return keys;
      };

      const applyPreview = (endDr: number, endDc: number) => {
        lastEndDr = endDr;
        lastEndDc = endDc;
        setFillPreviewKeys(new Set(previewFor(endDr, endDc)));
      };

      const hitCell = (clientX: number, clientY: number) => {
        const els = document.elementsFromPoint(clientX, clientY);
        for (const node of els) {
          if (!(node instanceof Element)) continue;
          const td = node.closest("td[data-captura-dr]");
          if (!td) continue;
          const dr = Number(td.getAttribute("data-captura-dr"));
          const dc = Number(td.getAttribute("data-captura-dc"));
          if (Number.isFinite(dr) && Number.isFinite(dc)) return { dr, dc };
        }
        return null;
      };

      applyPreview(brDr, brDc);

      const onMove = (ev: PointerEvent) => {
        const h = hitCell(ev.clientX, ev.clientY);
        if (h) applyPreview(h.dr, h.dc);
      };

      const onUp = (ev: PointerEvent) => {
        try {
          el.releasePointerCapture(ev.pointerId);
        } catch {
          /* ya liberado */
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        isFillDraggingRef.current = false;
        setFillPreviewKeys(null);

        const disp = applyCapturaFiltersOnDisplayOrder(
          rowsRef.current,
          globalSearchRef.current,
          columnFiltersRef.current
        );
        const maxR = disp.length - 1;
        const maxC = ENTREGA_PT_COLUMNS.length - 1;
        const targets = computeFillTargetCells(
          brDr,
          brDc,
          lastEndDr,
          lastEndDc,
          maxR,
          maxC
        );
        if (targets.length === 0) return;

        const updates: { rowId: string; colKey: string; value: string }[] = [];
        let step = 0;
        for (const t of targets) {
          const row = disp[t.dr];
          if (!row) continue;
          const col = ENTREGA_PT_COLUMNS[t.dc];
          if (!col) continue;
          step += 1;
          updates.push({
            rowId: stableRowId(row),
            colKey: col.key,
            value: fillValueForStep(source, step),
          });
        }
        if (updates.length === 0) return;

        pushUndo();
        setRows((prev) => {
          const copy = prev.map((r) => ({ ...r, values: { ...r.values } }));
          for (const u of updates) {
            const idx = copy.findIndex((r) => stableRowId(r) === u.rowId);
            if (idx < 0) continue;
            copy[idx].values[u.colKey] = u.value;
            const row = copy[idx];
            if (row.id != null) scheduleSave(row);
            else if (shouldPersistRow(row)) scheduleSave(row);
          }
          return ensureTrailing(copy);
        });
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [commitEdit, pushUndo, ensureTrailing, scheduleSave]
  );

  const beginEdit = useCallback((dr: number, dc: number, initial: string) => {
    const row = displayRows[dr];
    if (!row) return;
    setEditing({ dr, dc });
    setEditBuffer(initial);
  }, [displayRows]);

  const rectSelection = useCallback(
    (dr1: number, dc1: number, dr2: number, dc2: number) => {
      const r0 = Math.min(dr1, dr2);
      const r1 = Math.max(dr1, dr2);
      const c0 = Math.min(dc1, dc2);
      const c1 = Math.max(dc1, dc2);
      const set = new Set<string>();
      for (let r = r0; r <= r1; r++) {
        const row = displayRows[r];
        if (!row) continue;
        const id = stableRowId(row);
        for (let c = c0; c <= c1; c++) {
          set.add(cellKey(id, ENTREGA_PT_COLUMNS[c].key));
        }
      }
      return set;
    },
    [displayRows]
  );

  const moveFocus = useCallback(
    (dr: number, dc: number, extend: boolean) => {
      const maxR = displayRows.length - 1;
      const maxC = ENTREGA_PT_COLUMNS.length - 1;
      const nr = Math.max(0, Math.min(maxR, dr));
      const nc = Math.max(0, Math.min(maxC, dc));
      setFocus({ dr: nr, dc: nc });
      if (extend) {
        setSelected(rectSelection(anchorRef.current.dr, anchorRef.current.dc, nr, nc));
      } else {
        anchorRef.current = { dr: nr, dc: nc };
        const row = displayRows[nr];
        if (row) {
          setSelected(new Set([cellKey(stableRowId(row), ENTREGA_PT_COLUMNS[nc].key)]));
        }
      }
    },
    [displayRows, rectSelection]
  );

  const handleCellMouseEnter = useCallback(
    (e: React.MouseEvent, dr: number, dc: number) => {
      if (isFillDraggingRef.current) return;
      if (!isSelectDraggingRef.current) return;
      if ((e.buttons & 1) === 0) return;
      const { dr: ar, dc: ac } = anchorRef.current;
      setSelected(rectSelection(ar, ac, dr, dc));
      setFocus({ dr, dc });
    },
    [rectSelection]
  );

  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent, dr: number, dc: number) => {
      e.preventDefault();
      const cur = editingRef.current;
      if (cur) {
        skipBlurCommitRef.current = true;
        commitEdit(cur.dr, cur.dc, editBufferRef.current);
        setEditing(null);
        setEditBuffer("");
        queueMicrotask(() => {
          skipBlurCommitRef.current = false;
        });
      }
      if (e.button !== 0) return;

      gridRef.current?.focus();
      const row = displayRows[dr];
      if (!row) return;
      const id = stableRowId(row);
      const ck = cellKey(id, ENTREGA_PT_COLUMNS[dc].key);

      if (e.ctrlKey || e.metaKey) {
        isSelectDraggingRef.current = false;
        setSelected((prev) => {
          const n = new Set(prev);
          if (n.has(ck)) n.delete(ck);
          else n.add(ck);
          return n;
        });
        setFocus({ dr, dc });
        return;
      }

      if (e.shiftKey) {
        isSelectDraggingRef.current = false;
        setSelected(rectSelection(anchorRef.current.dr, anchorRef.current.dc, dr, dc));
        setFocus({ dr, dc });
        return;
      }

      isSelectDraggingRef.current = true;
      anchorRef.current = { dr, dc };
      setFocus({ dr, dc });
      setSelected(new Set([ck]));
    },
    [displayRows, commitEdit, rectSelection]
  );

  const runPaste = useCallback(
    (text: string) => {
      const matrix = parseClipboardTsv(text);
      if (matrix.length === 0) return;

      const dispNow = applyCapturaFiltersOnDisplayOrder(
        rowsRef.current,
        globalSearch,
        columnFilters
      );
      if (dispNow.length === 0) return;

      const f = focusRef.current;
      const originDr = Math.min(Math.max(0, f.dr), dispNow.length - 1);
      const originDc = Math.min(Math.max(0, f.dc), ENTREGA_PT_COLUMNS.length - 1);

      /** Un solo valor en un solo destino → mismo flujo que F2/doble clic/teclear (commitEdit). */
      if (matrix.length === 1 && matrix[0].length === 1) {
        const val = matrix[0][0];
        if (selected.size <= 1) {
          let dr: number;
          let dc: number;
          if (selected.size === 1) {
            const k = [...selected][0];
            const { rowId, colKey } = parseCellKey(k);
            dr = dispNow.findIndex((r) => stableRowId(r) === rowId);
            dc = columnIndex(colKey);
            if (dr < 0 || dc < 0) return;
          } else {
            dr = originDr;
            dc = originDc;
          }
          commitEdit(dr, dc, val);
          return;
        }
        pushUndo();
        setRows((prev) => {
          const copy = prev.map((r) => ({
            ...r,
            values: { ...r.values },
          }));
          for (const k of selected) {
            const { rowId, colKey } = parseCellKey(k);
            const idx = copy.findIndex((r) => stableRowId(r) === rowId);
            if (idx < 0) continue;
            copy[idx].values[colKey] = val;
            const row = copy[idx];
            if (row.id != null) scheduleSave(row);
            else if (shouldPersistRow(row)) scheduleSave(row);
          }
          return ensureTrailing(copy);
        });
        return;
      }

      pushUndo();
      setRows((prev) => {
        let copy = prev.map((r) => ({
          ...r,
          values: { ...r.values },
        }));
        let disp = applyCapturaFiltersOnDisplayOrder(copy, globalSearch, columnFilters);
        const needBottom = originDr + matrix.length;
        let added = 0;
        const MAX_GROW = 500;
        while (disp.length < needBottom && added < MAX_GROW) {
          copy.push(createBlankRow());
          added++;
          disp = applyCapturaFiltersOnDisplayOrder(copy, globalSearch, columnFilters);
        }
        copy = ensureTrailing(copy);
        disp = applyCapturaFiltersOnDisplayOrder(copy, globalSearch, columnFilters);

        const maxR = Math.min(matrix.length, Math.max(0, disp.length - originDr));
        if (maxR <= 0) {
          return ensureTrailing(copy);
        }

        for (let r = 0; r < maxR; r++) {
          const line = matrix[r];
          const dr = originDr + r;
          if (dr < 0 || dr >= disp.length) continue;
          for (let c = 0; c < line.length; c++) {
            const dc = originDc + c;
            if (dc < 0 || dc >= ENTREGA_PT_COLUMNS.length) continue;
            const col = ENTREGA_PT_COLUMNS[dc];
            const rowSnap = disp[dr];
            const idx = copy.findIndex((x) => stableRowId(x) === stableRowId(rowSnap));
            if (idx < 0) continue;
            copy[idx].values[col.key] = line[c];
            const updated = copy[idx];
            if (updated.id != null) scheduleSave(updated);
            else if (shouldPersistRow(updated)) scheduleSave(updated);
          }
        }
        return ensureTrailing(copy);
      });
    },
    [
      selected,
      globalSearch,
      columnFilters,
      pushUndo,
      ensureTrailing,
      scheduleSave,
      commitEdit,
    ]
  );

  const onGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el?.closest("[data-grid-filter-panel]") ||
        (typeof document !== "undefined" &&
          document.activeElement?.closest?.("[data-grid-filter-panel]"))
      ) {
        return;
      }

      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      const { dr, dc } = focus;

      if (editingRef.current) {
        return;
      }

      if (e.key === "c" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        let text: string;
        if (selected.size > 0) {
          text = selectionToTsv(selected, displayRows);
        } else {
          const row = displayRows[focus.dr];
          const col = ENTREGA_PT_COLUMNS[focus.dc];
          if (!row || !col) return;
          text = row.values[col.key] ?? "";
        }
        e.preventDefault();
        void navigator.clipboard.writeText(text).catch(() => {
          setSaveBanner("No se pudo copiar al portapapeles (permiso o contexto no seguro).");
          setTimeout(() => setSaveBanner(null), 4000);
        });
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        beginEdit(dr, dc, displayRows[dr]?.values[ENTREGA_PT_COLUMNS[dc].key] ?? "");
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.size === 0) return;
        const rowIds = new Set<string>();
        for (const k of selected) {
          rowIds.add(parseCellKey(k).rowId);
        }
        if (rowIds.size > 5) {
          e.preventDefault();
          setSaveBanner("Máximo 5 filas seleccionadas para borrar celdas.");
          setTimeout(() => setSaveBanner(null), 4000);
          return;
        }
        e.preventDefault();
        pushUndo();
        setRows((prev) => {
          const copy = prev.map((r) => ({
            ...r,
            values: { ...r.values },
          }));
          for (const k of selected) {
            const { rowId, colKey } = parseCellKey(k);
            const idx = copy.findIndex((r) => stableRowId(r) === rowId);
            if (idx < 0) continue;
            copy[idx].values[colKey] = "";
            const row = copy[idx];
            if (row.id != null) {
              scheduleSave(row);
            } else if (shouldPersistRow(row)) {
              scheduleSave(row);
            }
          }
          return ensureTrailing(copy);
        });
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        moveFocus(dr + 1, dc, e.shiftKey);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) moveFocus(dr, dc - 1, false);
        else moveFocus(dr, dc + 1, false);
        return;
      }

      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
        const extend = e.shiftKey;
        let ndr = dr;
        let ndc = dc;
        if (e.key === "ArrowUp") ndr--;
        if (e.key === "ArrowDown") ndr++;
        if (e.key === "ArrowLeft") ndc--;
        if (e.key === "ArrowRight") ndc++;
        moveFocus(ndr, ndc, extend);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        beginEdit(dr, dc, e.key);
        return;
      }
    },
    [
      focus,
      selected,
      displayRows,
      beginEdit,
      commitEdit,
      moveFocus,
      pushUndo,
      ensureTrailing,
      scheduleSave,
      undo,
      redo,
    ]
  );

  const handleCellDoubleClick = useCallback(
    (e: React.MouseEvent, dr: number, dc: number) => {
      e.preventDefault();
      e.stopPropagation();
      isSelectDraggingRef.current = false;
      const row = displayRows[dr];
      if (!row) return;
      const col = ENTREGA_PT_COLUMNS[dc];
      beginEdit(dr, dc, row.values[col.key] ?? "");
    },
    [displayRows, beginEdit]
  );

  const ghostSuffix =
    editing &&
    (() => {
      const { dr, dc } = editing;
      const row = displayRows[dr];
      if (!row) return null;
      const col = ENTREGA_PT_COLUMNS[dc];
      const full = findColumnSuggestion(
        rows,
        col.key,
        stableRowId(row),
        editBuffer
      );
      if (!full || full.toLowerCase() === editBuffer.toLowerCase()) return null;
      if (!full.toLowerCase().startsWith(editBuffer.toLowerCase())) return null;
      return full.slice(editBuffer.length);
    })();

  useEffect(() => {
    return () => {
      for (const t of saveTimers.current.values()) clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const endSelectDrag = () => {
      isSelectDraggingRef.current = false;
    };
    window.addEventListener("mouseup", endSelectDrag);
    window.addEventListener("blur", endSelectDrag);
    return () => {
      window.removeEventListener("mouseup", endSelectDrag);
      window.removeEventListener("blur", endSelectDrag);
    };
  }, []);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const root = gridRef.current;
      const t = e.target;
      if (root && t instanceof Node && root.contains(t)) {
        lastPointerInsideGridRef.current = true;
      } else {
        lastPointerInsideGridRef.current = false;
      }
    };
    document.addEventListener("mousedown", onDocMouseDown, true);
    return () => document.removeEventListener("mousedown", onDocMouseDown, true);
  }, []);

  /** Pegado con Ctrl+V: `paste` + clipboardData (síncrono dentro del gesto de usuario). */
  useEffect(() => {
    const onPasteCapture = (e: ClipboardEvent) => {
      if (editingRef.current) return;
      const root = gridRef.current;
      if (!root) return;
      const ae = document.activeElement;
      const focusOk =
        ae &&
        root.contains(ae) &&
        !(ae instanceof HTMLInputElement) &&
        !(ae instanceof HTMLTextAreaElement);
      const pointerOk = lastPointerInsideGridRef.current;
      if (!focusOk && !pointerOk) return;

      e.preventDefault();
      e.stopPropagation();
      const text = e.clipboardData?.getData("text/plain") ?? "";
      runPaste(text);
    };
    document.addEventListener("paste", onPasteCapture, true);
    return () => document.removeEventListener("paste", onPasteCapture, true);
  }, [runPaste]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = columnResizeRef.current;
      if (!d) return;
      const next = Math.max(d.minW, Math.round(d.startW + (e.clientX - d.startX)));
      setColumnWidths((prev) => (prev[d.key] === next ? prev : { ...prev, [d.key]: next }));
    }
    function onUp() {
      if (!columnResizeRef.current) return;
      columnResizeRef.current = null;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const beginColumnResize = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const col = ENTREGA_PT_COLUMNS.find((c) => c.key === colKey);
    const minW = col?.minWidth ?? 48;
    columnResizeRef.current = {
      key: colKey,
      startX: e.clientX,
      startW: columnWidthsRef.current[colKey] ?? minW,
      minW,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Entrega PT</h1>
          <p className="text-sm text-slate-500">
            Planta:{" "}
            <span className="text-slate-300">
              {PLANTA_OPTIONS.find((o) => o.value === planta)?.label ?? planta}
            </span>{" "}
            · Autoguardado al editar celdas
          </p>
        </div>
        <div className="flex w-full max-w-2xl items-center gap-2">
          <div className="w-full max-w-md">
            <Input
              aria-label="Búsqueda en tabla"
              placeholder="Buscar en todos los campos…"
              value={globalSearch}
              onValueChange={setGlobalSearch}
              startContent={<Search className="h-4 w-4 text-sky-400/80" />}
              classNames={{
                ...vividFieldClassNames,
                input: "text-slate-100 placeholder:text-slate-500",
              }}
            />
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImportImage}
          />
          <button
            type="button"
            onClick={openImportPicker}
            disabled={importingImage}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-600/20 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-600/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImageUp className="h-4 w-4" />
            {importingImage ? "Analizando..." : "Subir reporte"}
          </button>
          <button
            type="button"
            onClick={() => void exportToExcel()}
            disabled={exportExcelLoading}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-600/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportExcelLoading ? "Exportando…" : "Excel"}
          </button>
        </div>
      </div>

      {filterDatasetLoading && (
        <div className="shrink-0 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
          Cargando todas las filas para búsqueda y filtros…
        </div>
      )}

      {(filtersActive || filterOpenCol !== null) && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clearAllAppliedFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-500/35 bg-orange-950/40 px-3 py-1.5 text-xs font-medium text-orange-100 shadow-md transition hover:bg-orange-900/50"
          >
            <FilterX className="h-3.5 w-3.5 text-slate-400" />
            Quitar filtros y búsqueda
          </button>
        </div>
      )}

      {infoBanner && (
        <div className="shrink-0 flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {infoBanner}
        </div>
      )}

      {saveBanner && (
        <div className="shrink-0 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {saveBanner}
        </div>
      )}

      <div
        ref={gridRef}
        tabIndex={0}
        role="grid"
        aria-label="Hoja entrega PT"
        onKeyDown={onGridKeyDown}
        className="flex min-h-0 min-w-0 flex-1 flex-col outline-none ring-offset-2 ring-offset-slate-950 focus-visible:ring-2 focus-visible:ring-sky-500/50"
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-sky-500/25 bg-[rgb(22_42_74_/_0.55)] shadow-inner shadow-sky-900/30"
        >
          <table
            className="min-w-max border-collapse text-sm select-none"
            style={{ tableLayout: "fixed" }}
          >
            <thead className="sticky top-0 z-20 border-b border-sky-500/30 bg-gradient-to-r from-blue-950/95 via-slate-950/98 to-orange-950/90 shadow-md backdrop-blur-sm">
              <tr>
                <th
                  aria-hidden
                  className="min-w-0 border-b border-r border-sky-500/20 px-0 py-0 text-left font-normal"
                  style={{
                    width: ROW_NUM_COL_PX,
                    minWidth: ROW_NUM_COL_PX,
                    maxWidth: ROW_NUM_COL_PX,
                  }}
                >
                  <div className="py-2 pr-1 pl-1" />
                </th>
                {ENTREGA_PT_COLUMNS.map((col) => {
                  const w = columnWidths[col.key] ?? col.minWidth ?? 96;
                  return (
                    <th
                      key={col.key}
                      className="relative min-w-0 border-b border-sky-500/25 px-0 py-0 text-left font-medium text-sky-100"
                      style={{ width: w, minWidth: w, maxWidth: w }}
                    >
                      <div className="flex items-center gap-0.5 py-2 pl-2 pr-1">
                        <span className="min-w-0 flex-1 truncate" title={col.label}>
                          {col.label}
                        </span>
                        <button
                          type="button"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sky-300/80 transition hover:bg-orange-600/25 hover:text-orange-100"
                          aria-label={`Filtro ${col.label}`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setFilterOpenCol((c) => (c === col.key ? null : col.key));
                          }}
                        >
                          <Filter className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={`Redimensionar columna ${col.label}`}
                          className="h-9 w-2 shrink-0 cursor-col-resize touch-none rounded-sm border-0 bg-transparent p-0 hover:bg-sky-500/30 active:bg-sky-500/45"
                          onMouseDown={(ev) => beginColumnResize(ev, col.key)}
                        />
                      </div>
                      {filterOpenCol === col.key && (
                        <ColumnFilterPanel
                          colKey={col.key}
                          label={col.label}
                          options={distinctColumnValues(rows, col.key)}
                          selected={columnFilters[col.key]}
                          onApply={(set) => {
                            setColumnFilters((prev) => ({ ...prev, [col.key]: set }));
                            setFilterOpenCol(null);
                          }}
                          onClose={() => setFilterOpenCol(null)}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={ENTREGA_PT_COLUMNS.length + 1}
                    className="border-b border-slate-700/40 px-3 py-12 text-center text-sm text-slate-500"
                  >
                    {filterDatasetLoading
                      ? "Cargando datos…"
                      : filtersActive
                        ? "Ningún registro coincide con la búsqueda o los filtros de columna."
                        : "Sin filas."}
                  </td>
                </tr>
              ) : (
                displayRows.map((row, dr) => {
                const rowId = stableRowId(row);
                return (
                  <tr
                    key={rowId}
                    className="border-b border-white/[0.06] hover:bg-sky-500/10"
                  >
                    <td
                      className="min-w-0 border-r border-white/[0.06] px-0 py-0 align-middle text-right tabular-nums"
                      style={{
                        width: ROW_NUM_COL_PX,
                        minWidth: ROW_NUM_COL_PX,
                        maxWidth: ROW_NUM_COL_PX,
                      }}
                      onMouseDown={(e) => handleCellMouseDown(e, dr, 0)}
                      onMouseEnter={(e) => handleCellMouseEnter(e, dr, 0)}
                      onDoubleClick={(e) => handleCellDoubleClick(e, dr, 0)}
                    >
                      <div className="select-none px-1 py-2 text-[11px] leading-none text-slate-600">
                        {rowNumByStableId.get(rowId) ?? "\u00a0"}
                      </div>
                    </td>
                    {ENTREGA_PT_COLUMNS.map((col, dc) => {
                      const ck = cellKey(rowId, col.key);
                      const isSel = selected.has(ck);
                      const isFocus = focus.dr === dr && focus.dc === dc;
                      const isEdit = editing?.dr === dr && editing?.dc === dc;
                      const inFillPreview = fillPreviewKeys?.has(ck) ?? false;
                      const showFillHandle =
                        fillAnchor &&
                        fillAnchor.dr === dr &&
                        fillAnchor.dc === dc &&
                        !isEdit;
                      const val = row.values[col.key] ?? "";
                      const cw = columnWidths[col.key] ?? col.minWidth ?? 96;

                      return (
                        <td
                          key={col.key}
                          data-captura-dr={dr}
                          data-captura-dc={dc}
                          className={`relative min-w-0 border-r border-white/[0.04] px-0 py-0 align-middle ${
                            isSel ? "bg-sky-500/20" : ""
                          } ${isFocus && !isEdit ? "ring-1 ring-inset ring-cyan-400/70" : ""} ${
                            inFillPreview ? "bg-orange-500/15 ring-1 ring-inset ring-orange-400/50" : ""
                          }`}
                          style={{ width: cw, minWidth: cw, maxWidth: cw }}
                          onMouseDown={(e) => handleCellMouseDown(e, dr, dc)}
                          onMouseEnter={(e) => handleCellMouseEnter(e, dr, dc)}
                          onDoubleClick={(e) => handleCellDoubleClick(e, dr, dc)}
                        >
                          {isEdit ? (
                            <div className="relative min-h-[36px] min-w-0 overflow-hidden">
                              <div
                                className="pointer-events-none flex min-h-[36px] min-w-0 items-center overflow-hidden px-2 font-mono text-[13px]"
                                aria-hidden
                              >
                                <span className="text-sky-50">{editBuffer}</span>
                                {ghostSuffix ? (
                                  <span className="text-slate-500">{ghostSuffix}</span>
                                ) : null}
                              </div>
                              <input
                                className="absolute inset-0 z-10 w-full cursor-text border-0 bg-transparent px-2 font-mono text-[13px] text-transparent caret-sky-400 outline-none selection:bg-sky-500/30"
                                autoFocus
                                value={editBuffer}
                                onChange={(ev) => setEditBuffer(ev.target.value)}
                                onKeyDown={(ev) => {
                                  if (ev.key === "z" && (ev.ctrlKey || ev.metaKey) && !ev.shiftKey) {
                                    ev.preventDefault();
                                    undo();
                                    return;
                                  }
                                  if (ev.key === "Escape") {
                                    ev.preventDefault();
                                    skipBlurCommitRef.current = true;
                                    setEditing(null);
                                    setEditBuffer("");
                                    queueMicrotask(() => {
                                      skipBlurCommitRef.current = false;
                                    });
                                    gridRef.current?.focus();
                                    return;
                                  }
                                  if (ev.key === "Enter") {
                                    ev.preventDefault();
                                    const rowE = displayRows[dr];
                                    const colE = ENTREGA_PT_COLUMNS[dc];
                                    const raw = editBufferRef.current;
                                    const merged = rowE
                                      ? mergeColumnSuggestion(
                                          rowsRef.current,
                                          colE.key,
                                          stableRowId(rowE),
                                          raw
                                        )
                                      : raw;
                                    skipBlurCommitRef.current = true;
                                    commitEdit(dr, dc, merged);
                                    setEditing(null);
                                    setEditBuffer("");
                                    moveFocus(dr + 1, dc, ev.shiftKey);
                                    queueMicrotask(() => {
                                      skipBlurCommitRef.current = false;
                                      gridRef.current?.focus();
                                    });
                                    return;
                                  }
                                  if (ev.key === "Tab") {
                                    ev.preventDefault();
                                    const rowT = displayRows[dr];
                                    const colT = ENTREGA_PT_COLUMNS[dc];
                                    const rawT = editBufferRef.current;
                                    const mergedT = rowT
                                      ? mergeColumnSuggestion(
                                          rowsRef.current,
                                          colT.key,
                                          stableRowId(rowT),
                                          rawT
                                        )
                                      : rawT;
                                    skipBlurCommitRef.current = true;
                                    commitEdit(dr, dc, mergedT);
                                    setEditing(null);
                                    setEditBuffer("");
                                    if (ev.shiftKey) moveFocus(dr, dc - 1, false);
                                    else moveFocus(dr, dc + 1, false);
                                    queueMicrotask(() => {
                                      skipBlurCommitRef.current = false;
                                      gridRef.current?.focus();
                                    });
                                  }
                                }}
                                onBlur={() => {
                                  if (skipBlurCommitRef.current) return;
                                  commitEdit(dr, dc, editBufferRef.current);
                                  setEditing(null);
                                  setEditBuffer("");
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className="min-h-[36px] min-w-0 overflow-hidden text-ellipsis px-2 py-2 font-mono text-[13px] whitespace-nowrap text-slate-200"
                              title={val || undefined}
                            >
                              {val === "" ? (
                                <span className="text-slate-600">{"\u00a0"}</span>
                              ) : (
                                val
                              )}
                            </div>
                          )}
                          {showFillHandle ? (
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-label="Arrastrar para rellenar celdas"
                              className="absolute bottom-px right-px z-[25] h-2 w-2 cursor-crosshair rounded-[1px] border border-sky-200/80 bg-sky-400/95 touch-none shadow-[0_0_0_1px_rgba(15,23,42,0.4)] hover:scale-125 hover:border-sky-100 hover:bg-sky-300"
                              onPointerDown={(ev) =>
                                beginFillDrag(ev, dr, dc, row.values[col.key] ?? "")
                              }
                              onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                              }}
                            />
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ColumnFilterPanel({
  colKey,
  label,
  options,
  selected,
  onApply,
  onClose,
}: {
  colKey: string;
  label: string;
  options: string[];
  selected: Set<string> | null;
  onApply: (set: Set<string> | null) => void;
  onClose: () => void;
}) {
  const initial = useMemo(() => {
    if (selected && selected.size > 0) return new Set(selected);
    return new Set(options);
  }, [selected, options]);

  const [local, setLocal] = useState<Set<string>>(() => new Set(initial));
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLocal(new Set(initial));
  }, [initial, colKey]);

  useEffect(() => {
    setSearch("");
  }, [colKey]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const t = window.setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(t);
  }, [colKey]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  const commitApply = () => {
    if (local.size === 0) onApply(new Set());
    else if (local.size === options.length) onApply(null);
    else onApply(new Set(local));
  };

  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (!t || !ref.current) return;
      if (ref.current.contains(t)) return;
      const hostTh = ref.current.closest("th");
      if (hostTh?.contains(t)) return;
      onCloseRef.current();
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, []);

  const allDeselected = options.length > 0 && local.size === 0;

  return (
    <div
      ref={ref}
      data-grid-filter-panel
      className="absolute left-2 top-full z-50 mt-1 w-64 rounded-xl border border-orange-500/35 bg-slate-950/95 p-2 shadow-2xl shadow-orange-950/40 backdrop-blur-md"
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <p className="mb-2 px-1 text-xs font-semibold text-slate-400">{label}</p>
      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          commitApply();
        }}
        onKeyDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={searchInputRef}
          type="text"
          inputMode="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Buscar valores…"
          enterKeyHint="done"
          className="mb-2 w-full rounded-lg border border-sky-500/40 bg-slate-900/90 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-orange-500/30"
          autoComplete="off"
          aria-label={`Buscar en filtro ${label}`}
        />
        <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-950/40 px-2 py-1.5 text-xs text-orange-100 hover:bg-orange-900/50">
          <input
            type="checkbox"
            checked={allDeselected}
            onChange={() => {
              if (allDeselected) setLocal(new Set(options));
              else setLocal(new Set());
            }}
          />
          <span>Desmarcar todos</span>
        </label>
        <div className="max-h-48 overflow-y-auto text-xs">
          {filteredOptions.length === 0 ? (
            <p className="px-1 py-2 text-slate-500">Sin coincidencias</p>
          ) : (
            filteredOptions.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-sky-500/15"
              >
                <input
                  type="checkbox"
                  checked={local.has(opt)}
                  onChange={() => {
                    setLocal((prev) => {
                      const n = new Set(prev);
                      if (n.has(opt)) n.delete(opt);
                      else n.add(opt);
                      return n;
                    });
                  }}
                />
                <span className="truncate text-slate-200">{opt}</span>
              </label>
            ))
          )}
        </div>
        <div className="mt-2 flex gap-2 border-t border-orange-500/25 pt-2">
          <button
            type="button"
            className="flex-1 rounded-lg bg-red-950/50 py-1.5 text-xs font-medium text-red-200 hover:bg-red-900/60"
            onClick={() => onApply(null)}
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-500 to-orange-600 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 hover:brightness-110"
          >
            Aplicar
          </button>
        </div>
      </form>
    </div>
  );
}
