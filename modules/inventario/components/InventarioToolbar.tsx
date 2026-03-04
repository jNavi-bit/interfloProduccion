"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, Upload, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { replaceCatalogo, type ReplaceResult } from "../actions";

interface InventarioToolbarProps {
  clientes: string[];
  isAdmin: boolean;
  currentSearch?: string;
  currentCliente?: string;
}

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={2} />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por código único..."
          className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
        />
        {search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ClienteDropdown
        clientes={clientes}
        currentCliente={currentCliente}
        onChange={(value) => updateParams("cliente", value)}
      />

      <div className="sm:ml-auto">
        <ReplaceButton isAdmin={isAdmin} />
      </div>
    </div>
  );
}

function ClienteDropdown({
  clientes,
  currentCliente,
  onChange,
}: {
  clientes: string[];
  currentCliente: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const filtered = filter
    ? clientes.filter((c) => c.toLowerCase().includes(filter.toLowerCase()))
    : clientes;

  return (
    <div className="relative w-full sm:w-56" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-3.5 text-sm text-slate-200 outline-none transition hover:border-white/20 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
      >
        <span className={currentCliente ? "text-white" : "text-slate-500"}>
          {currentCliente || "Todos los clientes"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-xl shadow-black/40">
          <div className="border-b border-white/[0.06] p-2">
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar clientes..."
              className="h-8 w-full rounded-lg bg-slate-900/80 px-3 text-xs text-white placeholder:text-slate-500 outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setFilter("");
              }}
              className={`flex w-full items-center px-3.5 py-2 text-left text-sm transition ${
                !currentCliente
                  ? "font-semibold text-sky-400"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              Todos los clientes
            </button>
            {filtered.map((cliente) => (
              <button
                key={cliente}
                type="button"
                onClick={() => {
                  onChange(cliente);
                  setIsOpen(false);
                  setFilter("");
                }}
                className={`flex w-full items-center px-3.5 py-2 text-left text-sm transition ${
                  cliente === currentCliente
                    ? "font-semibold text-sky-400"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {cliente}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3.5 py-3 text-center text-xs text-slate-500">
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReplaceButton({ isAdmin }: { isAdmin: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<ReplaceResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleClick() {
    if (!isAdmin) {
      setResult({ success: false, error: "Solo los administradores pueden actualizar la fuente de datos." });
      return;
    }
    setShowModal(true);
    setResult(null);
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
      <button
        type="button"
        onClick={handleClick}
        className="flex h-10 items-center gap-2 rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 text-sm font-medium text-orange-300 transition hover:border-orange-400/40 hover:bg-orange-500/15 hover:text-orange-200"
      >
        <Upload className="h-4 w-4" strokeWidth={2} />
        <span className="hidden sm:inline">Actualizar fuente de datos</span>
        <span className="sm:hidden">Actualizar</span>
      </button>

      {(showModal || (result && !result.success && !showModal)) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800 p-6 shadow-2xl">
            {!result?.success && (
              <>
                <h3 className="font-display text-lg font-bold text-white">
                  {showModal ? "Actualizar fuente de datos" : "Acceso denegado"}
                </h3>

                {showModal && !result && (
                  <>
                    <p className="mt-2 text-sm text-slate-400">
                      Selecciona el archivo .csv que reemplazará todos los registros
                      actuales del catálogo de productos.
                    </p>
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" strokeWidth={2} />
                      <p className="text-xs text-amber-300">
                        Esta acción eliminará todos los registros anteriores y los reemplazará por los del nuevo archivo.
                      </p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white"
                    />
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => { setShowModal(false); setResult(null); }}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-400 disabled:opacity-50"
                      >
                        {isPending ? "Procesando..." : "Reemplazar tabla"}
                      </button>
                    </div>
                  </>
                )}

                {result && !result.success && (
                  <>
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" strokeWidth={2} />
                      <p className="text-sm text-red-300">{result.error}</p>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowModal(false); setResult(null); }}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {result?.success && (
              <>
                <div className="flex flex-col items-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" strokeWidth={1.5} />
                  <h3 className="mt-4 font-display text-lg font-bold text-white">
                    Datos actualizados
                  </h3>
                  <p className="mt-2 text-center text-sm text-slate-400">
                    Se insertaron{" "}
                    <span className="font-semibold text-emerald-400">
                      {result.inserted.toLocaleString()}
                    </span>{" "}
                    registros correctamente.
                  </p>
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setResult(null); }}
                    className="rounded-xl bg-emerald-500/20 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30"
                  >
                    Listo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
