export interface EntregaPtRowState {
  id?: number;
  /** Fila nueva aún no persistida */
  tempId?: string;
  /** Asignado en BD (`no_registro`); solo lectura en la hoja. */
  noRegistro?: number;
  values: Record<string, string>;
}
