"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Card, CardBody } from "@heroui/react";
import {
  Cloud,
  TrendingUp,
  Lock,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Database,
  Home,
  LayoutGrid,
  LogIn,
  ShieldCheck,
  FileText,
} from "lucide-react";

const navLinks = [
  { label: "Inicio", href: "#inicio", icon: Home },
  { label: "Características", href: "#caracteristicas", icon: LayoutGrid },
];

const features = [
  {
    icon: Cloud,
    title: "Datos en la Nube",
    description:
      "Acceso a los registros desde cualquier lugar con sincronización automática y respaldos seguros.",
    gradient: "from-sky-500 to-blue-600",
    light: "bg-sky-500/20",
  },
  {
    icon: TrendingUp,
    title: "Análisis en Tiempo Real",
    description: "Métricas y reportes actualizados al instante.",
    gradient: "from-emerald-500 to-teal-600",
    light: "bg-emerald-500/20",
  },
  {
    icon: Lock,
    title: "Seguridad de Datos",
    description:
      "Cifrado y controles de acceso para proteger la información.",
    gradient: "from-amber-500 to-orange-600",
    light: "bg-amber-500/20",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="#inicio"
            className="flex items-center gap-2 transition opacity-90 hover:opacity-100"
          >
            <Image
              src="/logoInterflo.png"
              alt="interflo."
              width={140}
              height={36}
              className="h-9 w-auto object-contain"
              style={{ width: "auto", height: "auto" }}
              priority
            />
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-white/10">
              Captura
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>
          <Button
            as={Link}
            href="#acceso"
            size="lg"
            className="min-h-[48px] min-w-[160px] rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-400/20 transition hover:shadow-orange-500/40 hover:ring-orange-400/40"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Acceder al Sistema
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section
        id="inicio"
        className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:py-36"
      >
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-sky-500/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orange-500/10 blur-[120px]" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm font-medium text-sky-300">
              <Sparkles className="h-4 w-4" />
              Reportes optimizados
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Sistema de Captura{" "}
              <span className="bg-gradient-to-r from-white via-slate-200 to-sky-200 bg-clip-text text-transparent">
                Centralizado
              </span>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-slate-400">
              Captura la producción diaria de forma eficiente y segura. Despliega
              reportes y análisis al instante.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                as={Link}
                href="#acceso"
                size="lg"
                className="min-h-[56px] rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 font-semibold text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/20 transition hover:shadow-orange-500/50 hover:ring-orange-400/40"
              >
                Acceso
                <ArrowRight className="ml-2 h-5 w-5" strokeWidth={2.5} />
              </Button>
              <Button
                as={Link}
                href="#caracteristicas"
                variant="bordered"
                size="lg"
                className="min-h-[56px] rounded-xl border-sky-400/40 bg-sky-500/10 px-8 py-4 font-medium text-sky-200 hover:border-sky-400/60 hover:bg-sky-500/20"
              >
                <LayoutGrid className="mr-2 h-5 w-5" />
                Características
              </Button>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative h-72 w-full max-w-lg sm:h-80">
              <div className="absolute inset-0 rounded-2xl border border-white/10 bg-slate-800/50 p-6 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    {[
                      { icon: Database, label: "Datos" },
                      { icon: Zap, label: "Eficiencia" },
                      { icon: Shield, label: "Seguridad" },
                      { icon: Cloud, label: "Integración" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
                      >
                        <Icon className="mb-2 h-8 w-8 text-sky-400" />
                        <span className="text-xs font-medium text-slate-400">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 flex-1 rounded-full bg-sky-500/40" />
                    <div className="h-2 flex-1 rounded-full bg-sky-500/20" />
                    <div className="h-2 flex-1 rounded-full bg-sky-500/30" />
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 -top-2 h-24 w-24 rounded-xl border border-sky-500/30 bg-sky-500/20 blur-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="caracteristicas"
        className="relative border-t border-white/5 bg-slate-50 px-4 py-20 text-slate-900 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que se necesita.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Características pensadas para simplificar la captura y el análisis
              de la información.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map(
              ({ icon: Icon, title, description, gradient, light }) => (
                <Card
                  key={title}
                  className="group rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-300/50"
                >
                  <CardBody className="gap-5 p-6">
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} ${light} text-white shadow-lg transition duration-300 group-hover:scale-105`}
                    >
                      <Icon className="h-7 w-7" strokeWidth={2} />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-slate-900">
                      {title}
                    </h3>
                    <p className="leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </CardBody>
                </Card>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/logoInterflo.png"
              alt="interflo."
              width={100}
              height={26}
              className="h-6 w-auto object-contain opacity-80"
              style={{ width: "auto", height: "auto" }}
            />
          </div>
          <p className="text-center text-sm text-slate-500 sm:text-left">
            © 2026 interflo. Desarrollado por Axel Javier Navor García. Todos
            los derechos reservados.
          </p>
          <div className="flex items-center gap-8 text-sm">
            <Link
              href="#privacidad"
              className="flex items-center gap-2 text-slate-500 transition hover:text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              Política de Privacidad
            </Link>
            <Link
              href="#terminos"
              className="flex items-center gap-2 text-slate-500 transition hover:text-white"
            >
              <FileText className="h-4 w-4" />
              Términos de Servicio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
