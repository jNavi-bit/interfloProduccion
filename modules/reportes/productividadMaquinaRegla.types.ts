/**
 * Tipos alineados con la tabla `productividad_maquina_regla` (Supabase).
 * Uso en reporte de productividad: cargar reglas activas, ordenar por `prioridad` DESC
 * y tomar la primera que coincida con (planta, maquina, no_maquina, producto).
 *
 * Porcentaje ≈ (suma_metrica_grupo * multiplicador_numerador) / capacidad_diaria * 100
 * (grupo = mismo día + misma maquina + mismo no_maquina; soldadura puede partir por producto).
 *
 * Si `omitir_en_reporte` es true, las filas de producción que casen con esa regla no entran al reporte.
 *
 * Con `no_maquina_modo` = `lista`, `no_maquina_valores` debe ser un arreglo de un solo elemento (un registro = una máquina).
 */

export type PlantaRegla = "llave2" | "periferico" | "perisur";

export type MaquinaModo = "igual" | "contiene" | "prefijo";

export type NoMaquinaModo = "cualquiera" | "lista";

export type MetricaNumerador = "cantidad_producida" | "metros";

export type ProductoModo = "ninguno" | "igual_normalizado" | "soldadura_no_es_viga_ni_puntal";

export interface ProductividadMaquinaReglaRow {
  id: string;
  planta: PlantaRegla | null;
  prioridad: number;
  omitir_en_reporte: boolean;
  etiqueta: string;
  maquina_patron: string;
  maquina_modo: MaquinaModo;
  no_maquina_modo: NoMaquinaModo;
  no_maquina_valores: unknown[] | null;
  capacidad_diaria: number | null;
  metrica_numerador: MetricaNumerador;
  multiplicador_numerador: number;
  producto_modo: ProductoModo;
  producto_valor: string | null;
  descripcion_formula: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
