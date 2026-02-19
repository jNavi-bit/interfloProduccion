"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  ClipboardList,
  BarChart3,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { UserProfile } from "../types";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: Home },
  {
    label: "Captura de producción",
    href: "/dashboard/captura",
    icon: ClipboardList,
  },
  { label: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
  { label: "Inventario", href: "/dashboard/inventario", icon: Package },
  {
    label: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
  {
    label: "Administrar usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
    adminOnly: true,
  },
];

interface SidebarProps {
  user: UserProfile;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";
  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full w-64 flex-col
          border-r border-white/[0.06] bg-slate-900
          transition-transform duration-300 ease-in-out
          lg:static lg:z-auto lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logoInterflo.png"
              alt="interflo."
              width={120}
              height={32}
              className="h-7 w-auto object-contain"
              style={{ width: "auto", height: "auto" }}
              priority
            />
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                    transition-colors duration-150
                    ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }
                  `}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold text-sky-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
