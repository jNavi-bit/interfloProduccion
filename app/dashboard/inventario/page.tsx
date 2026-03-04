import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import {
  InventarioPage,
  getCatalogoProductos,
  getDistinctClientes,
  getCatalogoCount,
} from "@/modules/inventario";

export default async function InventarioRoute({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; cliente?: string; planta?: string }>;
}) {
  const user = await getUserProfile();
  if (!user) redirect("/login");

  const params = await searchParams;

  const [productos, clientes, totalRegistros] = await Promise.all([
    getCatalogoProductos({
      search: params.search,
      cliente: params.cliente,
    }),
    getDistinctClientes(),
    getCatalogoCount(),
  ]);

  return (
    <InventarioPage
      productos={productos}
      clientes={clientes}
      totalRegistros={totalRegistros}
      isAdmin={user.role === "admin"}
      currentSearch={params.search}
      currentCliente={params.cliente}
    />
  );
}
