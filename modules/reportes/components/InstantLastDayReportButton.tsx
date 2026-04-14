"use client";

import { useState, useTransition, type ReactNode } from "react";
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
import { LastDayMachineReportClientSection } from "./LastDayMachineReportClientSection";

type InstantLastDayReportButtonProps = {
  planta: PlantaValue;
  /** Clases extra para el botón (p. ej. en toolbar de captura). */
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Si se pasa, sustituye el texto por defecto del botón (p. ej. etiqueta responsive). */
  children?: ReactNode;
};

export function InstantLastDayReportButton({
  planta,
  className,
  size = "md",
  children,
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
        {children ?? "Reporte del último día"}
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
                  <LastDayMachineReportClientSection
                    report={report}
                    planta={planta}
                    fechaIso={report.fechaIso}
                    scrollClassName="max-h-[min(55vh,24rem)]"
                    compact
                  />
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
