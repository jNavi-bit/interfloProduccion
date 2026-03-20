"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
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
  const isCapturaWide = pathname.startsWith("/dashboard/captura");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-white antialiased">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <main
          className={
            isCapturaWide
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "flex-1 overflow-y-auto"
          }
        >
          <div
            className={`mx-auto ${
              isCapturaWide
                ? "flex min-h-0 w-full max-w-none flex-1 flex-col px-4 py-3 sm:px-6 sm:py-4"
                : "max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
            }`}
          >
            <div className="mb-6 shrink-0 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            <div
              className={
                isCapturaWide ? "flex min-h-0 min-w-0 flex-1 flex-col" : undefined
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
