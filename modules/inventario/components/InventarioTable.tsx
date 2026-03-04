import { Package } from "lucide-react";
import type { CatalogoProducto } from "../types";

interface InventarioTableProps {
  productos: CatalogoProducto[];
  hasFilters: boolean;
}

const columns: { key: keyof CatalogoProducto; label: string; align?: "right" }[] = [
  { key: "codigo_unico", label: "Código único" },
  { key: "proyecto", label: "Proyecto" },
  { key: "cliente", label: "Cliente" },
  { key: "componente", label: "Componente" },
  { key: "acabado", label: "Acabado" },
  { key: "familia", label: "Familia" },
  { key: "cantidad_PL", label: "Cant. PL", align: "right" },
  { key: "avance_existe", label: "Estado" },
  { key: "peso_unitario", label: "Peso unit.", align: "right" },
];

export function InventarioTable({ productos, hasFilters }: InventarioTableProps) {
  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-slate-900/30 py-16">
        <Package className="h-10 w-10 text-slate-600" strokeWidth={1.5} />
        <p className="mt-4 text-sm text-slate-500">
          {hasFilters
            ? "No se encontraron registros con los filtros aplicados."
            : "No hay registros en el catálogo."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Mostrando {productos.length} registro{productos.length !== 1 ? "s" : ""}
        {hasFilters ? " (filtrado)" : ""}
      </p>
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`whitespace-nowrap px-4 py-3 font-medium text-slate-400 ${
                      col.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {productos.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    const isCode = col.key === "codigo_unico";
                    const isComponent = col.key === "componente";

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${
                          col.align === "right"
                            ? "whitespace-nowrap text-right font-mono text-slate-200"
                            : isCode
                              ? "whitespace-nowrap font-mono font-medium text-sky-400"
                              : isComponent
                                ? "min-w-[200px] max-w-[360px] text-slate-300"
                                : "whitespace-nowrap text-slate-300"
                        }`}
                      >
                        {value ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

