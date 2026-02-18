"use client";

import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-950 text-white antialiased">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 min-h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:flex-nowrap sm:gap-0 sm:px-6 sm:py-0">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 transition opacity-90 hover:opacity-100 sm:gap-2"
          >
            <Image
              src="/logoInterflo.png"
              alt="interflo."
              width={140}
              height={36}
              className="h-8 w-auto object-contain sm:h-9"
              style={{ width: "auto", height: "auto" }}
              priority
            />
            <span className="hidden rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-white/10 sm:inline">
              Captura de producción
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:py-2.5"
          >
            <span className="hidden sm:inline">Volver al inicio</span>
            <span className="sm:hidden">Inicio</span>
          </Link>
        </div>
      </header>

      <main className="relative flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center px-3 py-10 sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:py-20">
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-sky-500/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orange-500/10 blur-[120px]" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative w-full max-w-[420px] px-0">
          <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-10">
            <h1 className="font-display text-center text-xl font-bold tracking-tight text-white sm:text-3xl">
              Acceso al sistema
            </h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-400 sm:mt-3">
              Ingresa tu correo y contraseña para continuar.
            </p>
            <div className="mt-6 sm:mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
