import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";
import { ManualMarkdown } from "./ManualMarkdown";

export const metadata: Metadata = {
  title: "Manual de requisitos técnicos | interflo.",
  description:
    "Requisitos técnicos para la instalación y operación del sistema Interflo Producción.",
};

export default async function ManualRequisitosTecnicosPage() {
  const filePath = path.join(
    process.cwd(),
    "docs",
    "MANUAL_REQUISITOS_TECNICOS.md"
  );
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch {
    content =
      "_No se pudo cargar el manual._ Comprueba que el archivo `docs/MANUAL_REQUISITOS_TECNICOS.md` exista en el despliegue.";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 lg:max-w-4xl">
          <Link
            href="/"
            className="text-sm font-medium text-sky-400 transition hover:text-sky-300"
          >
            ← Volver al inicio
          </Link>
          <span className="text-xs text-slate-500">Documentación técnica</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 pb-16 lg:max-w-4xl">
        <article
          className="rounded-2xl border border-sky-500/20 bg-gradient-to-b from-[rgb(22_42_74_/_0.45)] to-slate-950/80 p-6 shadow-[0_0_60px_-20px_rgba(56,189,248,0.15)] sm:p-10"
          aria-label="Manual de requisitos técnicos"
        >
          <ManualMarkdown content={content} />
        </article>
      </main>
    </div>
  );
}
