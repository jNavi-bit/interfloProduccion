"use client";

import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { signOut } from "@/modules/auth/actions";
import type { UserProfile } from "../types";

interface DashboardShellProps {
  user: UserProfile;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-white antialiased">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-400 ring-1 ring-white/10">
              Planta {user.planta}
            </span>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </form>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
