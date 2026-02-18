import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/database/utils/supabase/server";
import { signOut } from "@/modules/auth/actions";
import Image from "next/image";
import Link from "next/link";
import { Construction, LogOut } from "lucide-react";

/**
 * Lectura de sesión en el mismo archivo (no en Server Action).
 * Si no hay sesión, redirigir a login.
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-950 text-white antialiased">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 transition opacity-90 hover:opacity-100"
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
          <form action={signOut} className="inline-block">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-sky-500/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orange-500/10 blur-[120px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Construction className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            En construcción
          </h1>
          <p className="max-w-sm text-slate-400">
            El dashboard estará disponible próximamente.
          </p>
        </div>
      </main>
    </div>
  );
}
