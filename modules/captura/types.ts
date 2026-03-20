export interface ProduccionRowState {
  id?: number;
  /** Fila nueva aún no persistida */
  tempId?: string;
  /** Asignado en BD (`no_registro`); solo lectura en la hoja. */
  noRegistro?: number;
  values: Record<string, string>;
}

export interface CatalogoSkuMatch {
  found: true;
  cliente: string | null;
  componente: string | null;
  acabado: string | null;
  peso_unitario: string | null;
}

export interface CatalogoSkuMiss {
  found: false;
}

export type CatalogoSkuResult = CatalogoSkuMatch | CatalogoSkuMiss;
