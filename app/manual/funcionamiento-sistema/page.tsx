import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";
import { ManualMarkdown } from "../requisitos-tecnicos/ManualMarkdown";

export const metadata: Metadata = {
  title: "Funcionamiento del sistema y requisitos (IEEE 830) | interflo.",
  description:
    "Flujo operativo por secciones y trazabilidad de requisitos funcionales y no funcionales al estilo IEEE Std 830-1998.",
};

export default async function ManualFuncionamientoSistemaPage() {
  const filePath = path.join(
    process.cwd(),
    "docs",
    "GUIA_FUNCIONAMIENTO_SISTEMA.md"
  );
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch {
    content =
      "_No se pudo cargar la guía._ Comprueba que el archivo `docs/GUIA_FUNCIONAMIENTO_SISTEMA.md` exista en el despliegue.";
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
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-slate-500">
            <Link
              href="/manual/requisitos-tecnicos"
              className="text-sky-500/90 transition hover:text-sky-400"
            >
              Requisitos técnicos
            </Link>
            <span className="hidden sm:inline" aria-hidden>
              ·
            </span>
            <span>IEEE 830-1998 (práctica SRS)</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 pb-16 lg:max-w-4xl">
        <article
          className="rounded-2xl border border-orange-500/20 bg-gradient-to-b from-[rgb(45_30_20_/_0.35)] to-slate-950/80 p-6 shadow-[0_0_60px_-20px_rgba(251,146,60,0.12)] sm:p-10"
          aria-label="Guía de funcionamiento y requisitos del sistema"
        >
          <ManualMarkdown content={content} />
        </article>
      </main>
    </div>
  );
}
