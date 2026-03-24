"use client";

import { useState, useTransition } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { FileBarChart2 } from "lucide-react";
import type { PlantaValue } from "@/modules/dashboard/plants";
import { getInstantLastDayMachineReport } from "../instantLastDayReportActions";

type InstantLastDayReportButtonProps = {
  planta: PlantaValue;
  /** Clases extra para el botón (p. ej. en toolbar de captura). */
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function InstantLastDayReportButton({
  planta,
  className,
  size = "md",
}: InstantLastDayReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Awaited<
    ReturnType<typeof getInstantLastDayMachineReport>
  > | null>(null);
  const [pending, startTransition] = useTransition();

  function loadReport() {
    setError(null);
    setReport(null);
    startTransition(async () => {
      const res = await getInstantLastDayMachineReport(planta);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setReport(res);
    });
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        radius="lg"
        variant="bordered"
        className={
          className ??
          "border-orange-500/40 bg-orange-950/35 font-medium text-orange-100"
        }
        startContent={<FileBarChart2 className="h-4 w-4" />}
        onPress={() => {
          setOpen(true);
          loadReport();
        }}
      >
        Reporte del último día
      </Button>

      <Modal
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setReport(null);
            setError(null);
          }
        }}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "border border-orange-500/30 bg-slate-950 text-slate-100",
          header: "border-b border-white/10",
          footer: "border-t border-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="font-display text-lg">
                  Resumen por máquina (última fecha con reportes)
                </span>
                {report?.ok && (
                  <span className="text-sm font-normal text-slate-400">
                    {report.fechaDisplay}{" "}
                    <span className="font-mono text-slate-500">
                      ({report.fechaIso})
                    </span>
                    {" · "}
                    {report.sourceRowCount} registro
                    {report.sourceRowCount !== 1 ? "s" : ""} en ese día
                  </span>
                )}
              </ModalHeader>
              <ModalBody className="gap-3">
                {pending && (
                  <p className="text-sm text-slate-400">Generando reporte…</p>
                )}
                {error && (
                  <p className="text-sm text-danger-300">{error}</p>
                )}
                {report?.ok && !pending && (
                  <>
                    {(report.productividadUnmatchedRows > 0 ||
                      report.productividadOmittedRows > 0) && (
                      <p className="text-xs text-amber-200/90">
                        Productividad:{" "}
                        {report.productividadUnmatchedRows > 0 && (
                          <>
                            {report.productividadUnmatchedRows} fila
                            {report.productividadUnmatchedRows !== 1
                              ? "s"
                              : ""}{" "}
                            sin regla aplicable
                          </>
                        )}
                        {report.productividadUnmatchedRows > 0 &&
                          report.productividadOmittedRows > 0 &&
                          " · "}
                        {report.productividadOmittedRows > 0 && (
                          <>
                            {report.productividadOmittedRows} omitida
                            {report.productividadOmittedRows !== 1
                              ? "s"
                              : ""}{" "}
                            por configuración
                          </>
                        )}
                        . Los kilos y metros incluyen todas las filas del día.
                      </p>
                    )}
                    <div className="ui-table-wrap overflow-hidden">
                      <div className="max-h-[min(60vh,28rem)] overflow-auto">
                        <table className="ui-table min-w-[640px]">
                          <thead>
                            <tr>
                              <th className="px-3 py-2">Máquina</th>
                              <th className="px-3 py-2">No. máquina</th>
                              <th className="px-3 py-2 text-right">Kilos</th>
                              <th className="px-3 py-2 text-right">Metros</th>
                              <th className="px-3 py-2">Productividad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.rows.map((r) => (
                              <tr key={`${r.maquina}|${r.noMaquinaLabel}`}>
                                <td className="px-3 py-2 text-slate-200">
                                  {r.maquina}
                                </td>
                                <td className="px-3 py-2 text-slate-300">
                                  {r.noMaquinaLabel}
                                </td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums text-amber-200">
                                  {r.kilos.toLocaleString("es-MX", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums text-sky-200">
                                  {r.metros.toLocaleString("es-MX", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="max-w-[280px] px-3 py-2 text-xs text-orange-100">
                                  {r.productividad}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cerrar
                </Button>
                <Button
                  color="primary"
                  className="bg-gradient-to-r from-sky-500 to-orange-600 font-semibold"
                  isDisabled={pending}
                  onPress={() => loadReport()}
                >
                  Actualizar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
