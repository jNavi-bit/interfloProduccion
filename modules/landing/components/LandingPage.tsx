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
  BookOpen,
  ListTree,
} from "lucide-react";

const navLinks = [
  { label: "Inicio", href: "#inicio", icon: Home },
  { label: "Características", href: "#caracteristicas", icon: LayoutGrid },
];

type LandingPageProps = {
  /** Indica si hay sesión (viene del servidor para evitar hidratación). */
  isLoggedIn?: boolean;
};

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

export function LandingPage({ isLoggedIn = false }: LandingPageProps) {
  const accessHref = isLoggedIn ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
        <div className="relative flex h-14 min-h-14 items-center px-4 py-2 sm:h-16 sm:px-8 sm:py-0">
          <Link
            href="#inicio"
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
          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
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
            href={accessHref}
            size="lg"
            className="ml-auto min-h-[44px] min-w-0 shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-400/20 transition hover:shadow-orange-500/40 hover:ring-orange-400/40 sm:min-h-[48px] sm:min-w-[160px] sm:px-6 sm:py-3"
          >
            <LogIn className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Acceder al Sistema</span>
            <span className="sm:hidden">Acceder</span>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section
        id="inicio"
        className="relative overflow-hidden px-3 py-12 sm:px-6 sm:py-28 lg:py-36"
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
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-5 sm:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 sm:px-4 sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Reportes optimizados
            </div>
            <h1 className="font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              Captura de producción{" "}
              <span className="bg-gradient-to-r from-white via-slate-200 to-sky-200 bg-clip-text text-transparent">
                Centralizada
              </span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              Captura la producción diaria de forma eficiente y segura. Despliega
              informes y análisis al instante.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button
                as={Link}
                href={accessHref}
                size="lg"
                className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/20 transition hover:shadow-orange-500/50 hover:ring-orange-400/40 sm:min-h-[56px] sm:w-auto sm:px-8 sm:py-4"
              >
                Acceso
                <ArrowRight className="ml-2 h-5 w-5 shrink-0" strokeWidth={2.5} />
              </Button>
              <Button
                as={Link}
                href="#caracteristicas"
                variant="bordered"
                size="lg"
                className="min-h-[48px] w-full rounded-xl border-sky-400/40 bg-sky-500/10 px-6 py-3 font-medium text-sky-200 hover:border-sky-400/60 hover:bg-sky-500/20 sm:min-h-[56px] sm:w-auto sm:px-8 sm:py-4"
              >
                <LayoutGrid className="mr-2 h-5 w-5 shrink-0" />
                Características
              </Button>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative h-56 w-full max-w-lg sm:h-72 sm:h-80">
              <div className="absolute inset-0 rounded-2xl border border-white/10 bg-slate-800/50 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
                <div className="flex h-full flex-col gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-2 sm:gap-3">
                    {[
                      { icon: Database, label: "Datos" },
                      { icon: Zap, label: "Eficiencia" },
                      { icon: Shield, label: "Seguridad" },
                      { icon: Cloud, label: "Integración" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center justify-center rounded-xl bg-white/5 py-2 ring-1 ring-white/10 transition hover:bg-white/10 py-2 sm:py-0"
                      >
                        <Icon className="mb-1 h-6 w-6 text-sky-400 sm:mb-2 sm:h-8 sm:w-8" />
                        <span className="text-[10px] font-medium text-slate-400 sm:text-xs">
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
        className="relative border-t border-white/5 bg-slate-50 px-3 py-14 text-slate-900 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-14">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">
              Todo lo que se necesita.
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:mt-3 sm:text-base">
              Características pensadas para simplificar la captura y el análisis
              de la información.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3 sm:gap-8">
            {features.map(
              ({ icon: Icon, title, description, gradient, light }) => (
                <Card
                  key={title}
                  className="group rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-300/50"
                >
                  <CardBody className="gap-4 p-4 sm:gap-5 sm:p-6">
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} ${light} text-white shadow-lg transition duration-300 group-hover:scale-105`}
                    >
                      <Icon className="h-7 w-7" strokeWidth={2} />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 sm:text-xl">
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
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
      <footer className="border-t border-white/5 bg-slate-950 px-3 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row sm:gap-6">
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
          <p className="text-center text-xs text-slate-500 sm:text-left sm:text-sm">
            © 2026 interflo. Desarrollado por Axel Javier Navor García. Todos
            los derechos reservados.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8 sm:text-sm">
            <Link
              href="#privacidad"
              className="flex items-center gap-2 text-xs text-slate-500 transition hover:text-white sm:text-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Política de Privacidad
            </Link>
            <Link
              href="#terminos"
              className="flex items-center gap-2 text-xs text-slate-500 transition hover:text-white sm:text-sm"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Términos de Servicio
            </Link>
            <Link
              href="/manual/requisitos-tecnicos"
              className="flex items-center gap-2 text-xs text-slate-500 transition hover:text-white sm:text-sm"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Manual de requisitos técnicos
            </Link>
          </div>
        </div>
      </footer>

      <Link
        href="/manual/funcionamiento-sistema"
        className="fixed bottom-3 left-3 z-40 flex max-w-[min(100vw-1.5rem,14rem)] items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/55 px-2.5 py-1.5 text-[10px] font-medium text-slate-500 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-white/18 hover:text-slate-300 sm:bottom-4 sm:left-4 sm:max-w-none sm:px-3 sm:text-[11px]"
        aria-label="Ver funcionamiento del sistema y requisitos IEEE 830"
      >
        <ListTree className="h-3 w-3 shrink-0 opacity-70 sm:h-3.5 sm:w-3.5" aria-hidden />
        <span className="leading-tight">
          Funcionamiento <span className="text-slate-600 sm:inline">·</span>{" "}
          <span className="hidden sm:inline">requisitos</span>
        </span>
      </Link>
    </div>
  );
}
