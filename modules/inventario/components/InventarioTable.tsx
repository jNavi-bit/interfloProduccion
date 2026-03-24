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
      <div className="gradient-ring-surface flex flex-col items-center justify-center rounded-2xl py-16 shadow-xl shadow-orange-950/30">
        <div className="rounded-2xl bg-gradient-to-br from-orange-600/30 to-amber-500/20 p-4 ring-2 ring-orange-500/25">
          <Package className="h-10 w-10 text-orange-300" strokeWidth={1.5} />
        </div>
        <p className="mt-4 text-sm text-slate-400">
          {hasFilters
            ? "No se encontraron registros con los filtros aplicados."
            : "No hay registros en el catálogo."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-sky-300/70">
        Mostrando {productos.length} registro{productos.length !== 1 ? "s" : ""}
        {hasFilters ? " (filtrado)" : ""}
      </p>
      <div className="ui-table-wrap">
        <div className="overflow-x-auto">
          <table className="ui-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`whitespace-nowrap px-4 py-3 ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map((row) => (
                <tr key={row.id}>
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
                              ? "whitespace-nowrap font-mono font-semibold text-cyan-300"
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
