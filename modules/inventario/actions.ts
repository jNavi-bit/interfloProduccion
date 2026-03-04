"use server";

import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { getUserProfile } from "@/modules/dashboard/queries";

export type ReplaceResult =
  | { success: true; inserted: number }
  | { success: false; error: string };

export async function replaceCatalogo(formData: FormData): Promise<ReplaceResult> {
  const user = await getUserProfile();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Solo los administradores pueden actualizar la fuente de datos." };
  }

  const file = formData.get("csv") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No se seleccionó ningún archivo." };
  }

  if (!file.name.endsWith(".csv")) {
    return { success: false, error: "El archivo debe ser .csv" };
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return { success: false, error: "El archivo CSV está vacío o no tiene registros válidos." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error: deleteError } = await supabase
    .from("catalogo_productos")
    .delete()
    .gte("id", 0);

  if (deleteError) {
    return { success: false, error: `Error al limpiar tabla: ${deleteError.message}` };
  }

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase
      .from("catalogo_productos")
      .insert(batch);

    if (insertError) {
      return {
        success: false,
        error: `Error al insertar lote ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}. Se insertaron ${inserted} registros antes del error.`,
      };
    }
    inserted += batch.length;
  }

  return { success: true, inserted };
}

function parseCSV(text: string): Record<string, string | number | null>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).reduce<Record<string, string | number | null>[]>((acc, line) => {
    const values = splitCSVLine(line);
    const row: Record<string, string | number | null> = {};
    let hasAnyValue = false;

    headers.forEach((header, i) => {
      const key = header.trim();
      if (!key) return;
      const val = values[i]?.trim() ?? "";
      if (val === "") {
        row[key] = null;
      } else if (key === "cantidad_PL") {
        row[key] = parseInt(val, 10) || 0;
        hasAnyValue = true;
      } else {
        row[key] = val;
        hasAnyValue = true;
      }
    });

    if (hasAnyValue) {
      acc.push(row);
    }

    return acc;
  }, []);
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
