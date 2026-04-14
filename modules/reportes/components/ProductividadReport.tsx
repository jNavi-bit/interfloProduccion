"use client";

import { Fragment, useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Alert } from "@heroui/react";
import { ArrowLeft, ChevronDown, ChevronRight, Gauge } from "lucide-react";
import { downloadExcelWorkbook } from "@/lib/excelExport";
import { PLANTA_OPTIONS, type PlantaValue } from "@/modules/dashboard/plants";
import {
  getProductividadReport,
  type ProductividadReportMode,
  type ProductividadMaquinaGroup,
  type ProductividadBlock,
} from "../productividadReportActions";
import { ReportQueryToolbar } from "./ReportQueryToolbar";
import { ProductividadBarChart } from "./ProductividadBarChart";
import { productividadMaquinasToChartItems } from "../productividadChartUtils";

function productividadToExcelRows(maquinas: ProductividadMaquinaGroup[]): (string | number)[][] {
  const head = [
    "Máquina",
    "No. máquina",
    "Regla",
    "Proyecto",
    "Producto",
    "Longitud",
    "Suma cantidad",
    "Capacidad",
    "Productividad %",
  ];
  const rows: (string | number)[][] = [head];
  for (const mg of maquinas) {
    for (const block of mg.blocks) {
      for (const line of block.lines) {
        rows.push([
          mg.maquina,
          block.noMaquinaLabel,
          block.reglaEtiqueta,
          line.proyecto,
          line.producto,
          line.longitud,
          line.cantidadSum,
          "",
          "",
        ]);
      }
      const cantBlock = block.lines.reduce((s, l) => s + l.cantidadSum, 0);
      rows.push([
        mg.maquina,
        block.noMaquinaLabel,
        block.reglaEtiqueta,
        `Total ${block.noMaquinaLabel}`,
        "",
        "",
        cantBlock,
        block.capacidad,
        block.productividadPct,
      ]);
    }
  }
  return rows;
}

function fmtNum(n: number, maxFrac = 2): string {
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  });
}

function fmtPct(n: number): string {
  return `${fmtNum(n, 1)}%`;
}

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function currentYm(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function blockCantidadTotal(b: ProductividadBlock): number {
  return b.lines.reduce((s, l) => s + l.cantidadSum, 0);
}

function grandCantidad(maquinas: ProductividadMaquinaGroup[]): number {
  return maquinas.reduce(
    (s, m) => s + m.blocks.reduce((s2, b) => s2 + blockCantidadTotal(b), 0),
    0
  );
}

interface ProductividadReportProps {
  planta: PlantaValue;
}

export function ProductividadReport({ planta }: ProductividadReportProps) {
  const [mode, setMode] = useState<ProductividadReportMode>("day");
  const [day, setDay] = useState(todayYmd);
  const [monthYm, setMonthYm] = useState(currentYm);
  const [rangeStart, setRangeStart] = useState(todayYmd);
  const [rangeEnd, setRangeEnd] = useState(todayYmd);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maquinas, setMaquinas] = useState<ProductividadMaquinaGroup[] | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [omittedCount, setOmittedCount] = useState<number | null>(null);
  const [unmatchedCount, setUnmatchedCount] = useState<number | null>(null);

  const [openMaquinas, setOpenMaquinas] = useState<Set<string>>(() => new Set());

  const plantaLabel = useMemo(
    () => PLANTA_OPTIONS.find((o) => o.value === planta)?.label ?? planta,
    [planta]
  );

  const runReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductividadReport(
        planta,
        mode,
        mode === "day" ? day : undefined,
        mode === "month" ? monthYm : undefined,
        mode === "range" ? rangeStart : undefined,
        mode === "range" ? rangeEnd : undefined
      );
      if (!res.ok) {
        setError(res.error);
        setMaquinas(null);
        setRowCount(null);
        setOmittedCount(null);
        setUnmatchedCount(null);
        return;
      }
      setMaquinas(res.maquinas);
      setRowCount(res.rowCount);
      setOmittedCount(res.omittedCount);
      setUnmatchedCount(res.unmatchedCount);
      setOpenMaquinas(new Set(res.maquinas.map((m) => m.maquina)));
    } catch {
      setError("No se pudo cargar el reporte.");
      setMaquinas(null);
      setRowCount(null);
      setOmittedCount(null);
      setUnmatchedCount(null);
    } finally {
      setLoading(false);
    }
  }, [planta, mode, day, monthYm, rangeStart, rangeEnd]);

  const toggleMaquina = useCallback((m: string) => {
    setOpenMaquinas((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }, []);

  const totalGeneralCant = useMemo(
    () => (maquinas && maquinas.length > 0 ? grandCantidad(maquinas) : 0),
    [maquinas]
  );

  const productividadChartItems = useMemo(
    () =>
      maquinas && maquinas.length > 0 ? productividadMaquinasToChartItems(maquinas) : [],
    [maquinas]
  );

  const exportLabelSuffix =
    mode === "day" ? day : mode === "month" ? monthYm : `${rangeStart}_${rangeEnd}`;

  const exportToExcel = useCallback(() => {
    if (!maquinas || maquinas.length === 0) return;
    const rows = productividadToExcelRows(maquinas);
    downloadExcelWorkbook(`reporte-productividad-${planta}-${exportLabelSuffix}`, [
      { name: "Productividad", rows },
    ]);
  }, [planta, exportLabelSuffix, maquinas]);

  const canExport = Boolean(maquinas && maquinas.length > 0 && !loading);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/reportes?planta=${planta}`}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-mute transition hover:text-sky-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a reportes
          </Link>
          <div className="flex items-center gap-2">
            <Gauge className="h-7 w-7 text-sky-400" />
            <div>
              <h1 className="text-2xl font-semibold text-strong">Productividad por máquina</h1>
              <p className="text-sm text-subtle">
                Capacidad y % según reglas configuradas · Planta:{" "}
                <span className="text-main">{plantaLabel}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReportQueryToolbar
        mode={mode}
        onModeChange={(m) => setMode(m as ProductividadReportMode)}
        day={day}
        onDayChange={setDay}
        monthYm={monthYm}
        onMonthYmChange={setMonthYm}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onRangeStartChange={setRangeStart}
        onRangeEndChange={setRangeEnd}
        loading={loading}
        onRun={() => void runReport()}
        onExport={exportToExcel}
        canExport={canExport}
      />

      {error && (
        <Alert color="danger" variant="flat" title="Error" description={error} />
      )}

      {rowCount !== null && !error && (
        <p className="text-sm text-subtle">
          Filas de producción en el periodo: <span className="text-main">{rowCount}</span>
          {omittedCount != null && omittedCount > 0 && (
            <>
              {" "}
              · Omitidas (Granalladoras u otras):{" "}
              <span className="text-mute">{omittedCount}</span>
            </>
          )}
          {unmatchedCount != null && unmatchedCount > 0 && (
            <>
              {" "}
              · Sin regla de productividad:{" "}
              <span className="text-amber-400/90">{unmatchedCount}</span>
            </>
          )}
        </p>
      )}

      {productividadChartItems.length > 0 && !loading && !error && (
        <ProductividadBarChart
          className="mt-4"
          items={productividadChartItems}
          title="Productividad por máquina / no. máquina (% del periodo)"
        />
      )}

      {maquinas && maquinas.length > 0 && (
        <div className="ui-table-wrap">
          <div className="overflow-x-auto">
          <table className="ui-table min-w-[880px]">
            <thead>
              <tr>
                <th className="w-[120px] px-3 py-3">Máquina</th>
                <th className="w-[88px] px-2 py-3">No. máquina</th>
                <th className="min-w-[140px] px-3 py-3">Proyecto</th>
                <th className="min-w-[120px] px-3 py-3">Producto</th>
                <th className="w-[100px] px-2 py-3">Longitud</th>
                <th className="w-[120px] px-2 py-3 text-right">Suma cant. prod.</th>
                <th className="w-[100px] px-2 py-3 text-right">Capacidad</th>
                <th className="w-[100px] px-2 py-3 text-right">Productividad</th>
              </tr>
            </thead>
            <tbody>
              {maquinas.map((mg) => {
                const machineRowSpan = mg.blocks.reduce(
                  (sum, b) => sum + b.lines.length + 1,
                  0
                );
                const expanded = openMaquinas.has(mg.maquina);

                const bodyRows: ReactNode[] = [];
                let firstRowOfMachine = true;

                if (expanded) {
                  for (const block of mg.blocks) {
                    const blockSpan = block.lines.length + 1;
                    const cantBlock = blockCantidadTotal(block);
                    const showReglaSubtitle =
                      mg.blocks.filter((x) => x.noMaquinaLabel === block.noMaquinaLabel).length >
                      1;

                    for (let li = 0; li < block.lines.length; li++) {
                      const line = block.lines[li];
                      bodyRows.push(
                        <tr
                          key={`${block.blockId}-d-${li}`}
                          className="border-b border-slate-700/50 bg-[rgb(22_42_74_/_0.4)] hover:bg-sky-500/10"
                        >
                          {firstRowOfMachine ? (
                            <td
                              rowSpan={machineRowSpan}
                              className="align-top border-r border-sky-500/25 px-3 py-2 text-sm font-semibold text-sky-100"
                            >
                              {mg.maquina}
                            </td>
                          ) : null}
                          {li === 0 ? (
                            <td
                              rowSpan={blockSpan}
                              className="align-top border-r border-orange-500/25 px-2 py-2 font-mono text-xs text-orange-200/90"
                            >
                              <div>{block.noMaquinaLabel}</div>
                              {showReglaSubtitle && (
                                <div className="mt-1 text-[10px] font-normal leading-tight text-orange-300/90">
                                  {block.reglaEtiqueta}
                                </div>
                              )}
                            </td>
                          ) : null}
                          <td className="px-3 py-2 text-slate-300">{line.proyecto}</td>
                          <td className="px-3 py-2 text-slate-300">{line.producto}</td>
                          <td className="px-2 py-2 font-mono text-xs tabular-nums text-slate-500">
                            {line.longitud}
                          </td>
                          <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-100">
                            {fmtNum(line.cantidadSum)}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-600">—</td>
                          <td className="px-2 py-2 text-right text-slate-600">—</td>
                        </tr>
                      );
                      firstRowOfMachine = false;
                    }

                    bodyRows.push(
                      <tr
                        key={`${block.blockId}-tot`}
                        className="border-b border-orange-500/30 bg-gradient-to-r from-orange-950/50 to-amber-950/30 font-semibold"
                      >
                        <td colSpan={3} className="px-3 py-2.5 pl-8 text-orange-100">{`Total ${block.noMaquinaLabel}`}</td>
                        <td className="px-2 py-2.5 text-right font-mono tabular-nums text-orange-200">
                          {fmtNum(cantBlock)}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono tabular-nums text-amber-200">
                          {fmtNum(block.capacidad)}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono text-base tabular-nums text-emerald-300">
                          {fmtPct(block.productividadPct)}
                        </td>
                      </tr>
                    );
                  }
                }

                return (
                  <Fragment key={mg.maquina}>
                    <tr className="border-b border-orange-500/35 bg-gradient-to-r from-orange-950/55 via-blue-950/50 to-slate-950/80">
                      <td colSpan={8} className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => toggleMaquina(mg.maquina)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-semibold text-orange-100 transition hover:bg-white/5"
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-orange-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-orange-400" />
                          )}
                          <span className="tracking-tight">{mg.maquina}</span>
                          <span className="text-xs font-normal text-slate-400">
                            ({mg.blocks.length} grupo{mg.blocks.length !== 1 ? "s" : ""})
                          </span>
                        </button>
                      </td>
                    </tr>
                    {bodyRows}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-red-500/40 bg-gradient-to-r from-red-950/45 via-emerald-950/45 to-slate-950/90">
                <td colSpan={5} className="px-3 py-3 font-bold text-emerald-100">
                  Total general
                </td>
                <td className="px-2 py-3 text-right font-mono text-base font-bold tabular-nums text-emerald-200">
                  {fmtNum(totalGeneralCant)}
                </td>
                <td colSpan={2} className="px-2 py-3 text-right text-xs text-emerald-300/85">
                  Suma de cantidades mostradas
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      )}

      {maquinas && maquinas.length === 0 && !loading && rowCount !== null && rowCount > 0 && (
        <p className="text-center text-slate-500">
          No hay filas con regla de productividad para este periodo (revisa coincidencia de nombres de
          máquina o crea reglas en la base de datos).
        </p>
      )}

      {maquinas && maquinas.length === 0 && !loading && rowCount === 0 && (
        <p className="text-center text-slate-500">No hay registros para el periodo seleccionado.</p>
      )}
    </div>
  );
}
