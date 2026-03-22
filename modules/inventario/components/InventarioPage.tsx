import type { CatalogoProducto } from "../types";
import { InventarioToolbar } from "./InventarioToolbar";
import { InventarioTable } from "./InventarioTable";

interface InventarioPageProps {
  productos: CatalogoProducto[];
  clientes: string[];
  totalRegistros: number;
  isAdmin: boolean;
  currentSearch?: string;
  currentCliente?: string;
}

export function InventarioPage({
  productos,
  clientes,
  totalRegistros,
  isAdmin,
  currentSearch,
  currentCliente,
}: InventarioPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-strong sm:text-3xl">
          Inventario
        </h1>
        <p className="mt-1 text-sm text-mute">
          Catálogo de productos ·{" "}
          <span className="font-medium text-main">
            {totalRegistros.toLocaleString()}
          </span>{" "}
          registros totales
        </p>
      </div>

      <InventarioToolbar
        clientes={clientes}
        isAdmin={isAdmin}
        currentSearch={currentSearch}
        currentCliente={currentCliente}
      />

      <InventarioTable
        productos={productos}
        hasFilters={!!(currentSearch || currentCliente)}
      />
    </div>
  );
}
