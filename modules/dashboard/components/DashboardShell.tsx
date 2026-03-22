"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { UserProfile } from "../types";

interface DashboardShellProps {
  user: UserProfile;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const onPasswordPage = pathname.startsWith("/dashboard/cambiar-contrasena");
  const mustChange = user.mustChangePassword === true;

  useEffect(() => {
    if (mustChange && !onPasswordPage) {
      router.replace("/dashboard/cambiar-contrasena");
    }
  }, [mustChange, onPasswordPage, router]);

  /** Hojas de datos a pantalla completa (misma UX que captura). */
  const isFullViewportSheet =
    pathname.startsWith("/dashboard/captura") ||
    pathname.startsWith("/dashboard/entrega-pt");

  if (mustChange && onPasswordPage) {
    return (
      <div className="flex min-h-screen w-full bg-app text-strong antialiased">
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-app text-strong antialiased">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <main
          className={
            isFullViewportSheet
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "flex-1 overflow-y-auto"
          }
        >
          <div
            className={`mx-auto ${
              isFullViewportSheet
                ? "flex min-h-0 w-full max-w-none flex-1 flex-col px-4 py-3 sm:px-6 sm:py-4"
                : "max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
            }`}
          >
            <div className="mb-6 shrink-0 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-mute transition hover:bg-hl hover:text-strong"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            <div
              className={
                isFullViewportSheet ? "flex min-h-0 min-w-0 flex-1 flex-col" : undefined
              }
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
