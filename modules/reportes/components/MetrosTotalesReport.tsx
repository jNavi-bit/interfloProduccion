"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Alert } from "@heroui/react";
import { ArrowLeft, Ruler } from "lucide-react";
import { downloadExcelWorkbook, type ExcelSheetInput } from "@/lib/excelExport";
import { PLANTA_OPTIONS, type PlantaValue } from "@/modules/dashboard/plants";
import {
  getMetrosReport,
  type MetrosReportMode,
  type MetrosMaquinaGroup,
  type MetrosAggregatedRow,
} from "../metrosReportActions";
import { ReportQueryToolbar } from "./ReportQueryToolbar";

function fmtMetros(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function metrosToExcelSheets(
  daily: MetrosMaquinaGroup[] | null,
  aggregated: MetrosAggregatedRow[] | null,
  grandTotalDaily: number,
  grandTotalAgg: number
): ExcelSheetInput[] {
  const sheets: ExcelSheetInput[] = [];
  if (daily && daily.length > 0) {
    const head = [
      "Máquina",
      "No. máquina",
      "No. registro",
      "SKU",
      "Producto",
      "Cant. producida",
      "Metros",
      "Fecha",
    ];
    const rows: (string | number)[][] = [head];
    for (const mg of daily) {
      for (const ng of mg.noMaquinaGroups) {
        for (const r of ng.rows) {
          rows.push([
            mg.maquina,
            ng.noMaquinaLabel,
            r.noRegistro ?? "",
            r.sku,
            r.producto,
            r.cantidadProducida,
            r.metrosTotal,
            r.fecha,
          ]);
        }
        rows.push(["", "", "", "", "Subtotal no. máquina", "", ng.subtotalMetros, ""]);
      }
      rows.push(["", "", "", "", `Total ${mg.maquina}`, "", mg.totalMetros, ""]);
    }
    rows.push([
      "",
      "",
      "",
      "",
      "Total general (todas las máquinas)",
      "",
      grandTotalDaily,
      "",
    ]);
    sheets.push({ name: "Detalle", rows });
  }
  if (aggregated && aggregated.length > 0) {
    const head = ["Máquina", "No. máquina", "Total metros"];
    const rows: (string | number)[][] = [
      head,
      ...aggregated.map((r) => [r.maquina, r.noMaquinaLabel, r.totalMetros]),
      ["", "Total periodo", grandTotalAgg],
    ];
    sheets.push({ name: "Resumen", rows });
  }
  return sheets;
}

interface MetrosTotalesReportProps {
  planta: PlantaValue;
}

export function MetrosTotalesReport({ planta }: MetrosTotalesReportProps) {
  const [mode, setMode] = useState<MetrosReportMode>("day");
  const [day, setDay] = useState(todayYmd);
  const [monthYm, setMonthYm] = useState(currentYm);
  const [rangeStart, setRangeStart] = useState(todayYmd);
  const [rangeEnd, setRangeEnd] = useState(todayYmd);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daily, setDaily] = useState<MetrosMaquinaGroup[] | null>(null);
  const [aggregated, setAggregated] = useState<MetrosAggregatedRow[] | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);

  const plantaLabel = useMemo(
    () => PLANTA_OPTIONS.find((o) => o.value === planta)?.label ?? planta,
    [planta]
  );

  const runReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMetrosReport(
        planta,
        mode,
        mode === "day" ? day : undefined,
        mode === "month" ? monthYm : undefined,
        mode === "range" ? rangeStart : undefined,
        mode === "range" ? rangeEnd : undefined
      );
      if (!res.ok) {
        setError(res.error);
        setDaily(null);
        setAggregated(null);
        setRowCount(null);
        return;
      }
      setDaily(res.daily);
      setAggregated(res.aggregated);
      setRowCount(res.rowCount);
    } catch {
      setError("No se pudo cargar el reporte.");
      setDaily(null);
      setAggregated(null);
      setRowCount(null);
    } finally {
      setLoading(false);
    }
  }, [planta, mode, day, monthYm, rangeStart, rangeEnd]);

  const grandTotalDaily = useMemo(() => {
    if (!daily) return 0;
    return daily.reduce((s, g) => s + g.totalMetros, 0);
  }, [daily]);

  const grandTotalAgg = useMemo(() => {
    if (!aggregated) return 0;
    return aggregated.reduce((s, r) => s + r.totalMetros, 0);
  }, [aggregated]);

  const exportLabelSuffix =
    mode === "day" ? day : mode === "month" ? monthYm : `${rangeStart}_${rangeEnd}`;

  const exportToExcel = useCallback(() => {
    const sheets = metrosToExcelSheets(daily, aggregated, grandTotalDaily, grandTotalAgg);
    if (sheets.length === 0) return;
    downloadExcelWorkbook(`reporte-metros-${planta}-${exportLabelSuffix}`, sheets);
  }, [planta, exportLabelSuffix, daily, aggregated, grandTotalDaily, grandTotalAgg]);

  const canExport =
    ((daily && daily.length > 0) || (aggregated && aggregated.length > 0)) && !loading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
            <Ruler className="h-7 w-7 text-sky-400" />
            <div>
              <h1 className="text-2xl font-semibold text-strong">Metros totales</h1>
              <p className="text-sm text-subtle">
                Suma de <span className="text-mute">metros</span> por máquina · Planta:{" "}
                <span className="text-main">{plantaLabel}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReportQueryToolbar
        mode={mode}
        onModeChange={(m) => setMode(m as MetrosReportMode)}
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
        canExport={!!canExport}
      />

      {error && (
        <Alert color="danger" variant="flat" title="Error" description={error} />
      )}

      {rowCount !== null && !error && (
        <p className="text-sm text-subtle">
          Registros incluidos: <span className="text-main">{rowCount}</span>
        </p>
      )}

      {daily && daily.length > 0 && (
        <div className="space-y-8">
          <div className="ui-table-wrap">
            <div className="overflow-x-auto">
            <table className="ui-table min-w-[920px]">
              <thead>
                <tr>
                  <th className="px-3 py-2.5">No. registro</th>
                  <th className="px-3 py-2.5">SKU</th>
                  <th className="px-3 py-2.5">Producto</th>
                  <th className="px-3 py-2.5">Cant. producida</th>
                  <th className="px-3 py-2.5 text-right">Metros</th>
                  <th className="px-3 py-2.5">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((mg) => (
                  <Fragment key={mg.maquina}>
                    {mg.noMaquinaGroups.map((ng) => (
                      <Fragment key={`${mg.maquina}-${ng.noMaquinaLabel}`}>
                        <tr className="border-b border-sky-500/40 bg-gradient-to-r from-sky-600/25 via-blue-900/30 to-violet-800/25">
                          <td
                            colSpan={6}
                            className="px-3 py-2 text-xs font-semibold tracking-wide text-sky-100 uppercase"
                          >
                            {mg.maquina} · {ng.noMaquinaLabel}
                          </td>
                        </tr>
                        {ng.rows.map((r) => (
                          <tr key={r.id}>
                            <td className="px-3 py-2 pl-6 font-mono tabular-nums text-slate-200">
                              {r.noRegistro != null ? r.noRegistro : "—"}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-300">{r.sku || "—"}</td>
                            <td className="max-w-[220px] px-3 py-2 text-slate-300">
                              <span className="line-clamp-2" title={r.producto || undefined}>
                                {r.producto || "—"}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-200">{r.cantidadProducida || "—"}</td>
                            <td className="px-3 py-2 text-right font-mono tabular-nums text-cyan-200">
                              {fmtMetros(r.metrosTotal)}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-500">{r.fecha || "—"}</td>
                          </tr>
                        ))}
                        <tr className="border-b border-orange-500/25 bg-gradient-to-r from-orange-950/40 to-slate-900/60">
                          <td colSpan={4} className="px-3 py-2 pl-6 text-right font-medium text-orange-100/90">
                            Subtotal no. máquina
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-base font-semibold tabular-nums text-orange-200">
                            {fmtMetros(ng.subtotalMetros)}
                          </td>
                          <td />
                        </tr>
                      </Fragment>
                    ))}
                    <tr className="bg-gradient-to-r from-emerald-900/50 to-teal-900/35">
                      <td colSpan={4} className="px-3 py-2.5 font-semibold text-emerald-100">
                        Total {mg.maquina}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-lg font-bold tabular-nums text-emerald-200">
                        {fmtMetros(mg.totalMetros)}
                      </td>
                      <td />
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          <div className="flex justify-end rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-950/80 to-teal-950/60 px-4 py-3 shadow-lg shadow-emerald-900/20">
            <p className="text-sm text-emerald-100">
              <span className="text-emerald-200/85">Total del día (todas las máquinas):</span>{" "}
              <span className="text-lg font-bold tabular-nums text-emerald-50">
                {fmtMetros(grandTotalDaily)} m
              </span>
            </p>
          </div>
        </div>
      )}

      {daily && daily.length === 0 && !loading && rowCount === 0 && (
        <p className="text-center text-slate-500">No hay registros para el periodo seleccionado.</p>
      )}

      {aggregated && aggregated.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {mode === "month" ? "Totales por máquina y no. máquina (mes)" : "Totales por máquina y no. máquina (periodo)"}
          </h2>
          <div className="ui-table-wrap">
            <div className="overflow-x-auto">
            <table className="ui-table min-w-[480px]">
              <thead>
                <tr>
                  <th className="px-3 py-2.5">Máquina</th>
                  <th className="px-3 py-2.5">No. máquina</th>
                  <th className="px-3 py-2.5 text-right">Total m</th>
                </tr>
              </thead>
              <tbody>
                {aggregated.map((r, i) => (
                  <tr key={`${r.maquina}-${r.noMaquinaLabel}-${i}`}>
                    <td className="px-3 py-2 text-slate-200">{r.maquina}</td>
                    <td className="px-3 py-2 text-slate-300">{r.noMaquinaLabel}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium tabular-nums text-fuchsia-300">
                      {fmtMetros(r.totalMetros)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-red-950/40 via-emerald-950/50 to-slate-900/80">
                  <td colSpan={2} className="px-3 py-2.5 font-semibold text-emerald-100">
                    Total periodo
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-lg font-bold tabular-nums text-emerald-200">
                    {fmtMetros(grandTotalAgg)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </div>
      )}

      {aggregated && aggregated.length === 0 && !loading && rowCount === 0 && (
        <p className="text-center text-slate-500">No hay registros para el periodo seleccionado.</p>
      )}
    </div>
  );
}
