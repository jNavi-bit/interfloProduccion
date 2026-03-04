"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
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
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-6 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
