import type {
  InstantLastDayReportRow,
  InstantLastDayReportSuccess,
} from "./instantLastDayReportActions";
import type { ProductividadMaquinaGroup } from "./productividadReportActions";

export type ProductividadBarChartItem = {
  id: string;
  label: string;
  /** Valor numérico para la longitud de la barra (p. ej. % o kilos). */
  value: number;
  /** Texto junto a la barra. */
  displayValue: string;
  /** Eje: porcentaje o masa. */
  unit: "pct" | "kg";
};

/** Extrae el mayor porcentaje encontrado en celdas tipo "Regla: 85% · …". */
export function parseMaxPctFromProductividadCell(text: string): number {
  if (!text || text.trim() === "" || text.trim() === "—") return 0;
  const re = /(\d+(?:[.,]\d+)?)\s*%/g;
  let m: RegExpExecArray | null;
  let max = 0;
  while ((m = re.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(",", "."));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return max;
}

function fmtPctOne(n: number): string {
  return `${n.toLocaleString("es-MX", { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`;
}

/** Filas del reporte rápido → barras (% si hay datos; si no, kilos). */
export function instantLastDayRowsToChartItems(
  rows: InstantLastDayReportRow[]
): ProductividadBarChartItem[] {
  const withPct = rows.map((r, i) => {
    const pct = parseMaxPctFromProductividadCell(r.productividad);
    return {
      id: `${r.maquina}\u001f${r.noMaquinaLabel}\u001f${i}`,
      label: `${r.maquina} · ${r.noMaquinaLabel}`,
      value: pct,
      displayValue: pct > 0 ? fmtPctOne(pct) : "—",
      unit: "pct" as const,
    };
  });
  if (withPct.some((x) => x.value > 0)) {
    return withPct.sort((a, b) => b.value - a.value);
  }
  return rows
    .map((r, i) => ({
      id: `${r.maquina}\u001f${r.noMaquinaLabel}\u001f${i}`,
      label: `${r.maquina} · ${r.noMaquinaLabel}`,
      value: r.kilos,
      displayValue: r.kilos.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      unit: "kg" as const,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Grupos del reporte de productividad → una barra por bloque (máquina + no. máquina + regla). */
export function productividadMaquinasToChartItems(
  maquinas: ProductividadMaquinaGroup[]
): ProductividadBarChartItem[] {
  const items: ProductividadBarChartItem[] = [];
  for (const mg of maquinas) {
    for (const b of mg.blocks) {
      items.push({
        id: b.blockId,
        label: `${mg.maquina} · ${b.noMaquinaLabel}`,
        value: Math.max(0, b.productividadPct),
        displayValue: `${b.productividadPct.toLocaleString("es-MX", {
          maximumFractionDigits: 1,
          minimumFractionDigits: 0,
        })}%`,
        unit: "pct",
      });
    }
  }
  return items.sort((a, b) => b.value - a.value);
}

export function chartScaleMax(items: ProductividadBarChartItem[]): number {
  if (items.length === 0) return 1;
  const maxV = Math.max(...items.map((i) => i.value), 0);
  if (items[0]?.unit === "pct") {
    return Math.min(200, Math.max(100, maxV * 1.08, 10));
  }
  return Math.max(maxV * 1.05, 1);
}

/** Filas para `downloadExcelWorkbook` (reporte rápido último día). */
export function buildLastDayReportExcelAoA(
  report: InstantLastDayReportSuccess
): (string | number)[][] {
  const head = ["Máquina", "No. máquina", "Kilos", "Metros", "Productividad"];
  return [
    head,
    ...report.rows.map((r) => [
      r.maquina,
      r.noMaquinaLabel,
      r.kilos,
      r.metros,
      r.productividad,
    ]),
  ];
}
