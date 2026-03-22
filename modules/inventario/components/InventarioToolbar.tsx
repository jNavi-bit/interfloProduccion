"use client";

import { useMemo, useState, useRef, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { Search, Upload, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { vividFieldClassNames, vividSelectClassNames } from "@/lib/heroUiVivid";
import { replaceCatalogo, type ReplaceResult } from "../actions";

interface InventarioToolbarProps {
  clientes: string[];
  isAdmin: boolean;
  currentSearch?: string;
  currentCliente?: string;
}

const ALL_KEY = "__all__";

export function InventarioToolbar({
  clientes,
  isAdmin,
  currentSearch = "",
  currentCliente = "",
}: InventarioToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const clienteItems = useMemo(
    () => [
      { id: ALL_KEY, label: "Todos los clientes" },
      ...clientes.map((c) => ({ id: c, label: c })),
    ],
    [clientes]
  );

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const planta = searchParams.get("planta");
    if (planta) params.set("planta", planta);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams("search", value);
    }, 400);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
      <Input
        className="min-w-0 flex-1 sm:max-w-xs"
        label="Código único"
        labelPlacement="outside-top"
        variant="bordered"
        radius="lg"
        color="primary"
        classNames={vividFieldClassNames}
        value={search}
        onValueChange={handleSearchChange}
        placeholder="Buscar…"
        startContent={<Search className="h-4 w-4 shrink-0 text-sky-400" strokeWidth={2} />}
        endContent={
          search ? (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              radius="full"
              aria-label="Limpiar búsqueda"
              onPress={() => handleSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null
        }
      />

      <Select
        className="w-full sm:w-64"
        label="Cliente"
        labelPlacement="outside-top"
        variant="bordered"
        radius="lg"
        color="secondary"
        classNames={vividSelectClassNames}
        disallowEmptySelection
        items={clienteItems}
        selectedKeys={new Set([currentCliente || ALL_KEY])}
        onSelectionChange={(keys) => {
          const k = Array.from(keys)[0] as string | undefined;
          if (k === undefined) return;
          updateParams("cliente", k === ALL_KEY ? "" : k);
        }}
        listboxProps={{ className: "max-h-72 border border-fuchsia-500/30 bg-slate-950" }}
        popoverProps={{ placement: "bottom-start", offset: 10 }}
      >
        {(item) => (
          <SelectItem key={item.id} textValue={item.label}>
            {item.label}
          </SelectItem>
        )}
      </Select>

      <div className="sm:ml-auto">
        <ReplaceButton isAdmin={isAdmin} />
      </div>
    </div>
  );
}

function ReplaceButton({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ReplaceResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleOpen() {
    if (!isAdmin) {
      setResult({ success: false, error: "Solo los administradores pueden actualizar la fuente de datos." });
      setOpen(true);
      return;
    }
    setResult(null);
    setOpen(true);
  }

  function handleSubmit() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setResult({ success: false, error: "No se seleccionó ningún archivo." });
      return;
    }
    const formData = new FormData();
    formData.append("csv", file);
    startTransition(async () => {
      const res = await replaceCatalogo(formData);
      setResult(res);
      if (res.success) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        color="warning"
        variant="bordered"
        radius="lg"
        className="border-orange-400/50 font-medium text-orange-200"
        startContent={<Upload className="h-4 w-4" strokeWidth={2} />}
        onPress={handleOpen}
      >
        <span className="hidden sm:inline">Actualizar fuente de datos</span>
        <span className="sm:hidden">Actualizar</span>
      </Button>

      <Modal
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setResult(null);
        }}
        placement="center"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          base: "gradient-ring-surface border-0 shadow-2xl shadow-orange-950/20",
        }}
      >
        <ModalContent>
          <ModalHeader className="font-display text-lg text-foreground">
            {result?.success ? "Datos actualizados" : result ? "Error" : "Actualizar fuente de datos"}
          </ModalHeader>
          <ModalBody>
            {result?.success ? (
              <div className="flex flex-col items-center py-2">
                <CheckCircle2 className="h-12 w-12 text-success" strokeWidth={1.5} />
                <p className="mt-3 text-center text-sm text-default-600">
                  Se insertaron{" "}
                  <span className="font-semibold text-success">{result.inserted.toLocaleString()}</span>{" "}
                  registros correctamente.
                </p>
              </div>
            ) : result && !result.success ? (
              <Alert color="danger" variant="flat" title="Error" description={result.error} />
            ) : (
              <>
                <p className="text-sm text-default-600">
                  Selecciona el archivo .csv que reemplazará todos los registros actuales del catálogo
                  de productos.
                </p>
                <Alert
                  color="warning"
                  variant="flat"
                  className="mt-3"
                  title="Atención"
                  description="Esta acción eliminará todos los registros anteriores y los reemplazará por los del nuevo archivo."
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="mt-4 w-full rounded-xl border border-dashed border-default-300 bg-field px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
                />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            {result?.success ? (
              <Button
                color="success"
                variant="flat"
                radius="lg"
                onPress={() => {
                  setOpen(false);
                  setResult(null);
                }}
              >
                Listo
              </Button>
            ) : (
              <>
                <Button
                  variant="light"
                  radius="lg"
                  onPress={() => {
                    setOpen(false);
                    setResult(null);
                  }}
                >
                  {result && !result.success ? "Cerrar" : "Cancelar"}
                </Button>
                {!result && (
                  <Button
                    color="warning"
                    radius="lg"
                    className="font-semibold"
                    isLoading={isPending}
                    onPress={handleSubmit}
                  >
                    Reemplazar tabla
                  </Button>
                )}
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
