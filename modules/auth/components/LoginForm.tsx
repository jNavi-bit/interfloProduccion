"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { signIn, type SignInResult } from "../actions";

type FormState = SignInResult | null;

/** Contenedor del icono para que ambos inputs tengan la misma anchura y se vean simétricos */
const iconWrapperClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-l-xl border-r border-white/10 bg-white/5 text-slate-400";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await signIn(formData);
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-email"
          className="text-sm font-medium text-slate-300"
        >
          Correo electrónico
        </label>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5 ring-1 ring-transparent transition focus-within:border-sky-400/50 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-sky-400/20 hover:border-white/20 hover:bg-white/10">
          <span className={iconWrapperClass} aria-hidden>
            <Mail className="h-5 w-5" strokeWidth={2} />
          </span>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            required
            disabled={isPending}
            className="min-h-[48px] w-full flex-1 bg-transparent px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-password"
          className="text-sm font-medium text-slate-300"
        >
          Contraseña
        </label>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5 ring-1 ring-transparent transition focus-within:border-sky-400/50 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-sky-400/20 hover:border-white/20 hover:bg-white/10">
          <span className={iconWrapperClass} aria-hidden>
            <Lock className="h-5 w-5" strokeWidth={2} />
          </span>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isPending}
            className="min-h-[48px] w-full flex-1 bg-transparent px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {state && !state.success && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-300"
        >
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        isLoading={isPending}
        className="min-h-[52px] w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 font-semibold text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-400/20 transition hover:shadow-orange-500/40 hover:ring-orange-400/40"
      >
        {!isPending && (
          <>
            Entrar
            <ArrowRight className="ml-2 h-5 w-5 shrink-0" strokeWidth={2.5} />
          </>
        )}
        {isPending && "Entrando…"}
      </Button>

      <div className="border-t border-white/10 pt-6">
        <p className="text-center text-sm text-slate-400">
          ¿Sin cuenta?{" "}
          <Link
            href="/"
            className="font-medium text-sky-400 underline-offset-2 transition hover:text-sky-300 hover:underline"
          >
            Volver al inicio
          </Link>
        </p>
      </div>
    </form>
  );
}
