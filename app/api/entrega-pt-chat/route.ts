import OpenAI from "openai";
import { ENTREGA_PT_COLUMNS } from "@/modules/entregaPt/plantConfig";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type VisionRow = Record<string, string>;

type VisionPayload = {
  rows: VisionRow[];
};

function safeJsonParse(raw: string): VisionPayload {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as VisionPayload;
    return { rows: Array.isArray(parsed.rows) ? parsed.rows : [] };
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(trimmed.slice(start, end + 1)) as VisionPayload;
      return { rows: Array.isArray(parsed.rows) ? parsed.rows : [] };
    }
    return { rows: [] };
  }
}

export async function POST(req: Request) {
  try {
    const { imageDataUrl, planta } = (await req.json()) as {
      imageDataUrl?: string;
      planta?: string;
    };

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return Response.json({ error: "Falta imageDataUrl." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY no está configurada en el servidor." },
        { status: 500 }
      );
    }

    const columnKeys = ENTREGA_PT_COLUMNS.map((c) => c.key);

    const prompt = [
      "Eres un extractor OCR experto de reportes de entrega de producto terminado.",
      "Analiza la imagen y devuelve SOLO JSON valido (sin markdown, sin texto extra).",
      "Formato exacto de salida:",
      '{ "rows": [ { "<columna>": "<valor>" } ] }',
      "Cada objeto de rows debe usar SOLAMENTE estas columnas:",
      columnKeys.join(", "),
      "Reglas:",
      "- Si un valor no existe, enviar cadena vacia.",
      "- No inventar datos.",
      "- Detecta filas de la tabla principal con datos.",
      `- Planta detectada por contexto: ${planta ?? ""}.`,
      "- Devuelve maximo 120 filas.",
    ].join("\n");

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageDataUrl, detail: "auto" },
          ],
        },
      ],
    });

    const text = response.output_text ?? "";
    const parsed = safeJsonParse(text);

    return Response.json({ rows: parsed.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }
}
