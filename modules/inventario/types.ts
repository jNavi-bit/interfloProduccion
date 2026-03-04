export interface CatalogoProducto {
  id: number;
  codigo_unico: string | null;
  proyecto: string | null;
  cliente: string | null;
  componente: string | null;
  acabado: string | null;
  py: string | null;
  sistema: string | null;
  familia: string | null;
  nivel: string | null;
  cantidad_PL: number | null;
  cantidad_cliente: string | null;
  cantidad_consolida: string | null;
  cant_x_producir: string | null;
  avance: string | null;
  existencias: string | null;
  avance_existe: string | null;
  peso_unitario: string | null;
}
