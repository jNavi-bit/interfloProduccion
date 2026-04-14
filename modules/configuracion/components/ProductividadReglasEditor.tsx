"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Alert, Button, Checkbox, Input, NumberInput, Select, SelectItem } from "@heroui/react";
import { Settings2 } from "lucide-react";
import {
  listProductividadReglasConfig,
  splitProductividadReglasListaMultiples,
  updateProductividadRegla,
  type ProductividadReglaConfigRow,
  type UpdateProductividadReglaInput,
} from "../actions";

const MAQUINA_MODOS = [
  { value: "igual", label: "Igual (normalizado)" },
  { value: "prefijo", label: "Prefijo" },
  { value: "contiene", label: "Contiene" },
] as const;

const NO_MODOS = [
  { value: "cualquiera", label: "Cualquier no." },
  { value: "lista", label: "Lista JSON" },
] as const;

const METRICAS = [
  { value: "cantidad_producida", label: "Cantidad producida" },
  { value: "metros", label: "Metros" },
] as const;

const PRODUCTO_MODOS = [
  { value: "ninguno", label: "Sin filtro" },
  { value: "igual_normalizado", label: "Producto = valor" },
  { value: "soldadura_no_es_viga_ni_puntal", label: "Soldadura (no VIGA ni PUNTAL)" },
] as const;

const PLANTA_OPTS = [
  { value: "", label: "Todas las plantas" },
  { value: "llave2", label: "Llave" },
  { value: "periferico", label: "Periférico" },
  { value: "perisur", label: "Perisur" },
] as const;

const PLANTA_SELECT_KEY = (planta: string | null | undefined) =>
  planta == null || planta === "" ? "__all__" : planta;

const textareaFieldClass =
  "min-h-[68px] w-full rounded-lg border border-default-200 bg-default-100/30 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-default-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

const textareaMonoClass = `${textareaFieldClass} font-mono`;

function rowToForm(r: ProductividadReglaConfigRow): UpdateProductividadReglaInput {
  let json = "[]";
  if (r.no_maquina_valores != null) {
    try {
      json = JSON.stringify(r.no_maquina_valores);
    } catch {
      json = "[]";
    }
  }
  return {
    id: r.id,
    planta: r.planta,
    prioridad: r.prioridad,
    omitir_en_reporte: r.omitir_en_reporte,
    etiqueta: r.etiqueta,
    maquina_patron: r.maquina_patron,
    maquina_modo: r.maquina_modo,
    no_maquina_modo: r.no_maquina_modo,
    no_maquina_valores_json: json,
    capacidad_diaria: r.capacidad_diaria,
    metrica_numerador: r.metrica_numerador,
    multiplicador_numerador: r.multiplicador_numerador,
    producto_modo: r.producto_modo,
    producto_valor: r.producto_valor,
    descripcion_formula: r.descripcion_formula,
    activo: r.activo,
  };
}

interface ProductividadReglasEditorProps {
  isAdmin: boolean;
}

export function ProductividadReglasEditor({ isAdmin }: ProductividadReglasEditorProps) {
  const [rows, setRows] = useState<ProductividadReglaConfigRow[]>([]);
  const [forms, setForms] = useState<Record<string, UpdateProductividadReglaInput>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<Record<string, string | null>>({});
  const [splitMsg, setSplitMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    setLoadError(null);
    void listProductividadReglasConfig().then((res) => {
      if (!res.ok) {
        setLoadError(res.error);
        return;
      }
      setRows(res.rows);
      const f: Record<string, UpdateProductividadReglaInput> = {};
      for (const r of res.rows) {
        f[r.id] = rowToForm(r);
      }
      setForms(f);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = useCallback((id: string, patch: Partial<UpdateProductividadReglaInput>) => {
    setForms((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }, []);

  const save = useCallback(
    (id: string) => {
      const input = forms[id];
      if (!input) return;
      setSaveMsg((m) => ({ ...m, [id]: null }));
      startTransition(async () => {
        const res = await updateProductividadRegla(input);
        if (!res.ok) {
          setSaveMsg((m) => ({ ...m, [id]: res.error }));
          return;
        }
        setSaveMsg((m) => ({ ...m, [id]: "Guardado." }));
        load();
      });
    },
    [forms, load]
  );

  return (
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
          <Settings2 className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-strong">Productividad por máquina</h2>
          <p className="text-sm text-subtle">
            Capacidad diaria, multiplicador, métrica del numerador y reglas de coincidencia usadas en
            el reporte de productividad.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-mute">
        <p className="font-medium text-amber-200">Un número de máquina por registro</p>
        <p className="mt-2 text-xs leading-relaxed text-mute">
          Si usas <span className="text-main">No. máquina → Lista JSON</span>, escribe{" "}
          <span className="font-mono text-main">[1]</span> o <span className="font-mono text-main">[&quot;2&quot;]</span>, no{" "}
          <span className="font-mono text-subtle">[1,2]</span>. Para dos máquinas (ej. Fontai 1 y Fontai 2), crea{" "}
          <span className="text-main">dos filas</span> con el mismo patrón de máquina y capacidad, cada una con su número.
          Si ya tienes datos viejos con <span className="font-mono text-subtle">[1,2,...]</span>, usa el botón de abajo
          para partirlas automáticamente.
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3 text-sm text-mute">
        <p className="font-medium text-sky-300">Campo «Prioridad»</p>
        <p className="mt-2 text-xs leading-relaxed text-mute">
          Solo importa cuando <span className="text-main">varias reglas</span> podrían aplicarse
          a la misma fila de producción. El sistema las ordena de{" "}
          <span className="text-main">mayor a menor</span> prioridad y usa la{" "}
          <span className="text-main">primera que coincida</span>; no suma ni multiplica el
          porcentaje. Pon prioridad <span className="text-main">más alta</span> en reglas{" "}
          <span className="text-main">más específicas</span>.{" "}
          <span className="text-subtle">
            Ejemplo: soldadura — reglas VIGA y PUNTAL (p. ej. 200) deben ir antes que la regla «resto»
            que excluye VIGA y PUNTAL (p. ej. 100), para que cada producto use su capacidad y no la
            genérica.
          </span>
        </p>
      </div>

      {!isAdmin && (
        <Alert
          color="warning"
          variant="flat"
          radius="lg"
          className="mb-4"
          title="Solo lectura"
          description="Solo los administradores pueden guardar cambios. Puedes revisar la configuración actual."
        />
      )}

      {loadError && (
        <Alert
          color="danger"
          variant="flat"
          radius="lg"
          className="mb-4"
          description={loadError}
        />
      )}

      {isAdmin && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Button
            color="warning"
            variant="flat"
            radius="lg"
            size="sm"
            className="font-semibold"
            isDisabled={pending}
            onPress={() => {
              if (
                !window.confirm(
                  "Se buscarán reglas con «Lista JSON» y varios números (ej. [1,2]). Cada una se convertirá en varias filas (una por número) y se ajustarán las etiquetas. ¿Continuar?"
                )
              ) {
                return;
              }
              setSplitMsg(null);
              startTransition(async () => {
                const res = await splitProductividadReglasListaMultiples();
                if (!res.ok) {
                  setSplitMsg(res.error);
                  return;
                }
                setSplitMsg(
                  res.reglasAfectadas === 0
                    ? "No había reglas con lista de varios números."
                    : `Listo: ${res.reglasAfectadas} regla(s) partida(s), ${res.filasNuevas} fila(s) nuevas.`
                );
                load();
              });
            }}
          >
            Normalizar listas con varios números
          </Button>
          {splitMsg && (
            <span
              className={
                splitMsg.startsWith("No había") || splitMsg.startsWith("Listo:")
                  ? "text-sm text-emerald-400"
                  : "text-sm text-rose-300"
              }
            >
              {splitMsg}
            </span>
          )}
        </div>
      )}

      <div className="space-y-5">
        {rows.map((r) => {
          const f = forms[r.id];
          if (!f) return null;
          return (
            <div
              key={r.id}
              className="rounded-xl border border-line bg-field p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-medium text-main">{r.etiqueta}</h3>
                <span className="font-mono text-[10px] text-subtle">{r.id.slice(0, 8)}…</span>
              </div>

              <div className="grid w-full min-w-0 grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
                <Input
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full" }}
                  label="Etiqueta"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  value={f.etiqueta}
                  isDisabled={!isAdmin}
                  onValueChange={(v) => updateField(r.id, { etiqueta: v })}
                />
                <Select
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full" }}
                  label="Planta"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  disallowEmptySelection
                  selectedKeys={new Set([PLANTA_SELECT_KEY(f.planta)])}
                  onSelectionChange={(keys) => {
                    const k = Array.from(keys)[0] as string | undefined;
                    if (k === undefined) return;
                    updateField(r.id, { planta: k === "__all__" ? null : k });
                  }}
                  isDisabled={!isAdmin}
                  aria-label="Planta"
                >
                  {PLANTA_OPTS.map((o) => (
                    <SelectItem key={o.value || "__all__"} textValue={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
                <NumberInput
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full", inputWrapper: "min-h-10" }}
                  label="Prioridad"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  hideStepper
                  isDisabled={!isAdmin}
                  value={f.prioridad}
                  onValueChange={(v) =>
                    updateField(r.id, { prioridad: typeof v === "number" && !Number.isNaN(v) ? v : 0 })
                  }
                />
                <Input
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full" }}
                  label="Patrón máquina"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  value={f.maquina_patron}
                  isDisabled={!isAdmin}
                  onValueChange={(v) => updateField(r.id, { maquina_patron: v })}
                />
                <Select
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full" }}
                  label="Modo máquina"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  disallowEmptySelection
                  selectedKeys={new Set([f.maquina_modo])}
                  onSelectionChange={(keys) => {
                    const k = Array.from(keys)[0] as string | undefined;
                    if (k) updateField(r.id, { maquina_modo: k });
                  }}
                  isDisabled={!isAdmin}
                  aria-label="Modo máquina"
                >
                  {MAQUINA_MODOS.map((o) => (
                    <SelectItem key={o.value} textValue={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full" }}
                  label="No. máquina"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  disallowEmptySelection
                  selectedKeys={new Set([f.no_maquina_modo])}
                  onSelectionChange={(keys) => {
                    const k = Array.from(keys)[0] as string | undefined;
                    if (k) updateField(r.id, { no_maquina_modo: k });
                  }}
                  isDisabled={!isAdmin}
                  aria-label="Modo número de máquina"
                >
                  {NO_MODOS.map((o) => (
                    <SelectItem key={o.value} textValue={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
                {f.no_maquina_modo === "lista" && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="mb-1 block text-xs text-default-500">
                      Un solo valor JSON (ej. [1] o [&quot;3&quot;])
                    </label>
                    <textarea
                      value={f.no_maquina_valores_json}
                      disabled={!isAdmin}
                      onChange={(e) =>
                        updateField(r.id, { no_maquina_valores_json: e.target.value })
                      }
                      rows={2}
                      className={textareaMonoClass}
                    />
                  </div>
                )}
                <NumberInput
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full", inputWrapper: "min-h-10" }}
                  label="Capacidad diaria"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  hideStepper
                  isDisabled={!isAdmin || f.omitir_en_reporte}
                  value={
                    f.omitir_en_reporte
                      ? undefined
                      : f.capacidad_diaria === null || f.capacidad_diaria === undefined
                        ? undefined
                        : f.capacidad_diaria
                  }
                  onValueChange={(v) =>
                    updateField(r.id, {
                      capacidad_diaria: v == null ? null : v,
                    })
                  }
                />
                <Select
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full" }}
                  label="Métrica numerador"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  disallowEmptySelection
                  selectedKeys={new Set([f.metrica_numerador])}
                  onSelectionChange={(keys) => {
                    const k = Array.from(keys)[0] as string | undefined;
                    if (k) updateField(r.id, { metrica_numerador: k });
                  }}
                  isDisabled={!isAdmin}
                  aria-label="Métrica numerador"
                >
                  {METRICAS.map((o) => (
                    <SelectItem key={o.value} textValue={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
                <NumberInput
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full", inputWrapper: "min-h-10" }}
                  label="Multiplicador"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  hideStepper
                  isDisabled={!isAdmin}
                  value={f.multiplicador_numerador}
                  onValueChange={(v) =>
                    updateField(r.id, {
                      multiplicador_numerador:
                        typeof v === "number" && !Number.isNaN(v) ? v : 1,
                    })
                  }
                />
                <Select
                  className="w-full min-w-0"
                  classNames={{ base: "w-full max-w-full" }}
                  label="Filtro producto"
                  labelPlacement="outside-top"
                  size="sm"
                  variant="bordered"
                  radius="md"
                  disallowEmptySelection
                  selectedKeys={new Set([f.producto_modo])}
                  onSelectionChange={(keys) => {
                    const k = Array.from(keys)[0] as string | undefined;
                    if (k) updateField(r.id, { producto_modo: k });
                  }}
                  isDisabled={!isAdmin}
                  aria-label="Filtro producto"
                >
                  {PRODUCTO_MODOS.map((o) => (
                    <SelectItem key={o.value} textValue={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </Select>
                {f.producto_modo === "igual_normalizado" && (
                  <Input
                    className="w-full min-w-0"
                    classNames={{ base: "w-full max-w-full" }}
                    label="Valor producto"
                    labelPlacement="outside-top"
                    size="sm"
                    variant="bordered"
                    radius="md"
                    value={f.producto_valor ?? ""}
                    isDisabled={!isAdmin}
                    onValueChange={(v) => updateField(r.id, { producto_valor: v })}
                  />
                )}
                <div className="flex min-h-10 w-full flex-wrap items-center gap-x-8 gap-y-2 sm:col-span-2 lg:col-span-3">
                  <Checkbox
                    size="sm"
                    classNames={{ label: "text-sm text-main" }}
                    isSelected={f.omitir_en_reporte}
                    isDisabled={!isAdmin}
                    onValueChange={(v) => updateField(r.id, { omitir_en_reporte: v })}
                  >
                    Omitir en reporte
                  </Checkbox>
                  <Checkbox
                    size="sm"
                    classNames={{ label: "text-sm text-main" }}
                    isSelected={f.activo}
                    isDisabled={!isAdmin}
                    onValueChange={(v) => updateField(r.id, { activo: v })}
                  >
                    Activo
                  </Checkbox>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-1 block text-xs text-default-500">Descripción fórmula</label>
                  <textarea
                    value={f.descripcion_formula ?? ""}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      updateField(r.id, { descripcion_formula: e.target.value || null })
                    }
                    rows={2}
                    className={textareaFieldClass}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {isAdmin && (
                  <Button
                    color="primary"
                    radius="lg"
                    size="sm"
                    className="font-semibold"
                    isDisabled={pending}
                    onPress={() => save(r.id)}
                  >
                    Guardar regla
                  </Button>
                )}
                {saveMsg[r.id] && (
                  <span
                    className={
                      saveMsg[r.id] === "Guardado."
                        ? "text-sm text-emerald-400"
                        : "text-sm text-rose-300"
                    }
                  >
                    {saveMsg[r.id]}
                  </span>
                )}
                <span className="text-xs text-subtle">
                  Actualizado: {new Date(r.updated_at).toLocaleString("es-MX")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {rows.length === 0 && !loadError && (
        <p className="text-center text-sm text-subtle">No hay reglas en la base de datos.</p>
      )}
    </section>
  );
}
