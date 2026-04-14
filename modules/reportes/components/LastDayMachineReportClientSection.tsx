"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@heroui/react";
import { FileSpreadsheet } from "lucide-react";
import { downloadExcelWorkbook } from "@/lib/excelExport";
import type { InstantLastDayReportSuccess } from "../instantLastDayReportActions";
import {
  buildLastDayReportExcelAoA,
  instantLastDayRowsToChartItems,
} from "../productividadChartUtils";
import { LastDayMachineReportTableBody } from "./LastDayMachineReportTableBody";
import { ProductividadBarChart } from "./ProductividadBarChart";

type LastDayMachineReportClientSectionProps = {
  report: InstantLastDayReportSuccess;
  planta: string;
  /** YYYY-MM-DD para el nombre del archivo */
  fechaIso: string;
  scrollClassName?: string;
  /** Más compacto dentro del modal */
  compact?: boolean;
};

export function LastDayMachineReportClientSection({
  report,
  planta,
  fechaIso,
  scrollClassName = "max-h-[min(70vh,42rem)]",
  compact = false,
}: LastDayMachineReportClientSectionProps) {
  const chartItems = useMemo(
    () => instantLastDayRowsToChartItems(report.rows),
    [report.rows]
  );

  const exportExcel = useCallback(() => {
    const stamp = fechaIso.replace(/[^0-9-]/g, "") || "fecha";
    downloadExcelWorkbook(`reporte-rapido-ultimo-dia-${planta}-${stamp}`, [
      { name: "Último día", rows: buildLastDayReportExcelAoA(report) },
    ]);
  }, [planta, fechaIso, report]);

  return (
    <div className={compact ? "space-y-3" : "mt-4 space-y-4"}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          radius="lg"
          variant="bordered"
          className="border-emerald-500/40 bg-emerald-950/30 font-medium text-emerald-100"
          startContent={<FileSpreadsheet className="h-4 w-4" />}
          onPress={exportExcel}
        >
          Exportar a Excel
        </Button>
      </div>
      <ProductividadBarChart
        items={chartItems}
        title={
          chartItems[0]?.unit === "kg"
            ? "Kilos por máquina / no. máquina (sin % en texto de productividad)"
            : "Productividad (% máximo por celda) por máquina / no. máquina"
        }
      />
      <LastDayMachineReportTableBody report={report} scrollClassName={scrollClassName} />
    </div>
  );
}
