import * as XLSX from "xlsx";

const INVALID_SHEET_NAME = /[\\/*?:[\]]/g;

export type ExcelSheetInput = {
  name: string;
  rows: (string | number | null | undefined)[][];
};

function sanitizeSheetName(name: string): string {
  const s = name.replace(INVALID_SHEET_NAME, "-").trim().slice(0, 31);
  return s.length > 0 ? s : "Hoja1";
}

/** Genera un .xlsx en el cliente y dispara la descarga. */
export function downloadExcelWorkbook(filenameBase: string, sheets: ExcelSheetInput[]): void {
  if (sheets.length === 0) return;
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const s of sheets) {
    let name = sanitizeSheetName(s.name);
    let n = 1;
    while (used.has(name)) {
      const suffix = ` (${n++})`;
      name = sanitizeSheetName(s.name.slice(0, Math.max(1, 31 - suffix.length)) + suffix);
    }
    used.add(name);
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const fname = filenameBase.toLowerCase().endsWith(".xlsx")
    ? filenameBase
    : `${filenameBase}.xlsx`;
  XLSX.writeFile(wb, fname);
}
