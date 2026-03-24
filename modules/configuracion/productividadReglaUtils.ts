/**
 * Reglas de productividad: un registro = un solo no. de máquina cuando el modo es «lista».
 */

/** Quita sufijos tipo " 1,2" o " 1, 2, 3" al final de la etiqueta (no afecta "Máquina 12" con un solo número). */
export function strippedBaseEtiqueta(etiqueta: string): string {
  const t = etiqueta.trim();
  const multiNumSuffix = /\s+\d+(?:\s*[,，/／]\s*\d+)+\s*$/u;
  return t.replace(multiNumSuffix, "").trim() || t;
}

export function etiquetaParaUnNumero(etiquetaActual: string, num: unknown): string {
  const base = strippedBaseEtiqueta(etiquetaActual);
  const n = String(num).trim();
  return `${base} ${n}`.replace(/\s+/g, " ").trim();
}

/** null si OK; mensaje de error en español si no. */
export function validateListaUnSoloNumeroMaquina(arr: unknown[] | null): string | null {
  if (arr == null) {
    return "Con modo «lista», indica un valor JSON (un solo número por registro, ej. [1]).";
  }
  if (arr.length === 0) {
    return "La lista de números de máquina no puede estar vacía.";
  }
  if (arr.length > 1) {
    return "Solo un número de máquina por registro. Crea una fila por máquina (ej. Fontai 1 y Fontai 2), no uses [1,2] en la misma regla.";
  }
  return null;
}

export function coerceListaNumeros(raw: unknown): unknown[] | null {
  if (!Array.isArray(raw)) return null;
  return raw;
}
