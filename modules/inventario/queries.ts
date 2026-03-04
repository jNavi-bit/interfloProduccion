import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import type { CatalogoProducto } from "./types";

const VISIBLE_COLUMNS =
  "id, codigo_unico, proyecto, cliente, componente, acabado, py, sistema, familia, nivel, cantidad_PL, cantidad_cliente, cantidad_consolida, cant_x_producir, avance, existencias, avance_existe, peso_unitario";

export async function getCatalogoProductos(filters?: {
  search?: string;
  cliente?: string;
}): Promise<CatalogoProducto[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from("catalogo_productos")
    .select(VISIBLE_COLUMNS)
    .order("id", { ascending: true });

  if (filters?.search) {
    query = query.ilike("codigo_unico", `%${filters.search}%`);
  }

  if (filters?.cliente) {
    query = query.eq("cliente", filters.cliente);
  }

  query = query.limit(200);

  const { data } = await query;
  return (data as CatalogoProducto[]) ?? [];
}

export async function getDistinctClientes(): Promise<string[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data } = await supabase
    .from("catalogo_productos")
    .select("cliente")
    .not("cliente", "is", null)
    .order("cliente", { ascending: true });

  if (!data) return [];

  const unique = [...new Set(data.map((r) => r.cliente as string))];
  return unique;
}

export async function getCatalogoCount(): Promise<number> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { count } = await supabase
    .from("catalogo_productos")
    .select("id", { count: "exact", head: true });

  return count ?? 0;
}
