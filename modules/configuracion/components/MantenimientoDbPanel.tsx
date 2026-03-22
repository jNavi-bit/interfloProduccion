"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Checkbox,
  DatePicker,
  Input,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Database, Trash2 } from "lucide-react";
import {
  previewPurgeProduccionAntesDe,
  executePurgeProduccionAntesDe,
  type PurgeTargets,
} from "../actions";

function defaultCutoffYmd(): string {
  const y = new Date().getFullYear();
  return `${y}-01-01`;
}

const INITIAL_TARGETS: PurgeTargets = {
  capturaLlave2: true,
  capturaPeriferico: true,
  capturaPerisur: true,
  ptLlave2: false,
  ptPeriferico: false,
  ptPerisur: false,
};

const CONFIRM = "ELIMINAR";

function safeParse(ymd: string) {
  try {
    return parseDate(ymd);
  } catch {
    return parseDate(defaultCutoffYmd());
  }
}

export function MantenimientoDbPanel() {
  const [fechaCorte, setFechaCorte] = useState(defaultCutoffYmd);
  const [targets, setTargets] = useState<PurgeTargets>(INITIAL_TARGETS);
  const [confirmText, setConfirmText] = useState("");
  const [preview, setPreview] = useState<{
    counts: { table: string; count: number | null }[];
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setTarget = useCallback((key: keyof PurgeTargets, value: boolean) => {
    setTargets((t) => ({ ...t, [key]: value }));
    setPreview(null);
    setSuccess(null);
  }, []);

  const runPreview = useCallback(() => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await previewPurgeProduccionAntesDe(fechaCorte, targets);
      if (!res.ok) {
        setPreview(null);
        setError(res.error);
        return;
      }
      setPreview({ counts: res.counts, total: res.total });
    });
  }, [fechaCorte, targets]);

  const runPurge = useCallback(() => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await executePurgeProduccionAntesDe(fechaCorte, targets, confirmText);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const parts = res.deleted.map((d) => `${d.table}: ${d.count}`).join(" · ");
      setSuccess(`Eliminación completada. ${parts}`);
      setConfirmText("");
      setPreview(null);
    });
  }, [fechaCorte, targets, confirmText]);

  const canExecute = useMemo(
    () => confirmText.trim() === CONFIRM && preview != null && preview.total > 0,
    [confirmText, preview]
  );

  return (
    <section className="rounded-2xl border border-danger/30 bg-danger/5 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/15">
          <Database className="h-5 w-5 text-danger" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Mantenimiento de base de datos</h2>
          <p className="text-sm text-default-500">
            Solo administradores. Permite borrar datos históricos por fecha. La operación no se puede
            deshacer.
          </p>
        </div>
      </div>

      <Card shadow="sm" radius="lg" className="border border-separator bg-surface">
        <CardBody className="gap-4">
          <p className="text-sm text-default-600">
            Se eliminarán filas con <span className="font-medium text-foreground">fecha</span>{" "}
            estrictamente anterior a la fecha de corte (YYYY-MM-DD).
          </p>

          <DatePicker
            label="Fecha de corte"
            labelPlacement="outside-top"
            variant="bordered"
            radius="lg"
            className="max-w-xs"
            value={safeParse(fechaCorte)}
            onChange={(d) => {
              if (d) {
                setFechaCorte(d.toString());
                setPreview(null);
                setSuccess(null);
              }
            }}
            showMonthAndYearPickers
            popoverProps={{ placement: "bottom-start", offset: 10 }}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-default-600">Tablas de producción (captura)</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Checkbox
                isSelected={targets.capturaLlave2}
                onValueChange={(v) => setTarget("capturaLlave2", v)}
              >
                llave2Produccion
              </Checkbox>
              <Checkbox
                isSelected={targets.capturaPeriferico}
                onValueChange={(v) => setTarget("capturaPeriferico", v)}
              >
                perifericoProduccion
              </Checkbox>
              <Checkbox
                isSelected={targets.capturaPerisur}
                onValueChange={(v) => setTarget("capturaPerisur", v)}
              >
                perisurProduccion
              </Checkbox>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-default-600">Producto terminado (entrega PT)</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Checkbox isSelected={targets.ptLlave2} onValueChange={(v) => setTarget("ptLlave2", v)}>
                prodTerminadoLlave2
              </Checkbox>
              <Checkbox
                isSelected={targets.ptPeriferico}
                onValueChange={(v) => setTarget("ptPeriferico", v)}
              >
                prodTerminadoPeriferico
              </Checkbox>
              <Checkbox isSelected={targets.ptPerisur} onValueChange={(v) => setTarget("ptPerisur", v)}>
                prodTerminadoPerisur
              </Checkbox>
            </div>
          </div>

          <Button
            variant="bordered"
            radius="lg"
            isDisabled={pending}
            onPress={() => void runPreview()}
          >
            Vista previa (conteo)
          </Button>

          {preview && (
            <Card radius="lg" className="border border-primary/25 bg-primary/5">
              <CardBody className="gap-1 py-3">
                <p className="text-sm font-medium text-primary">Filas a eliminar: {preview.total}</p>
                <ul className="font-mono text-xs text-default-500">
                  {preview.counts.map((c) => (
                    <li key={c.table}>
                      {c.table}: {c.count ?? 0}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {preview && preview.total === 0 && (
            <p className="text-sm text-default-500">No hay filas que cumplan el criterio.</p>
          )}

          <div className="border-t border-separator pt-4">
            <Input
              label={`Confirmación: escribe ${CONFIRM}`}
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              color="danger"
              value={confirmText}
              onValueChange={setConfirmText}
              autoComplete="off"
              placeholder={CONFIRM}
              className="max-w-md"
            />
            <Button
              color="danger"
              radius="lg"
              className="mt-3 font-semibold"
              startContent={<Trash2 className="h-4 w-4" />}
              isDisabled={pending || !canExecute}
              onPress={() => void runPurge()}
            >
              Ejecutar eliminación
            </Button>
          </div>

          {error && <Alert color="danger" variant="flat" title="Error" description={error} />}
          {success && <Alert color="success" variant="flat" title="Listo" description={success} />}
        </CardBody>
      </Card>
    </section>
  );
}
