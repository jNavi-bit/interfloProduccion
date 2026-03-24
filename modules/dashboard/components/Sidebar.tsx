"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  ClipboardList,
  BarChart3,
  Package,
  PackageCheck,
  Settings,
  Users,
  X,
  LogOut,
  ChevronUp,
  Factory,
  Lock,
} from "lucide-react";
import type { UserProfile } from "../types";
import { signOut } from "@/modules/auth/actions";
import { PLANTA_OPTIONS, resolvePlantaForUser } from "../plants";

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
  {
    label: "Entrega PT",
    href: "/dashboard/entrega-pt",
    icon: PackageCheck,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = user.role === "admin";
  const activePlanta = resolvePlantaForUser(user, searchParams.get("planta"));
  const availableOptions = isAdmin
    ? PLANTA_OPTIONS
    : PLANTA_OPTIONS.filter((option) => option.value === activePlanta);
  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full w-64 flex-col
          border-r border-line bg-nav
          transition-transform duration-300 ease-in-out
          lg:static lg:z-auto lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
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
            className="flex h-8 w-8 items-center justify-center rounded-xl text-mute transition hover:bg-hl hover:text-strong lg:hidden"
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
                  href={`${item.href}?planta=${activePlanta}`}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                    transition-colors duration-150
                    ${
                      isActive
                        ? "bg-gradient-to-r from-sky-500/20 to-orange-500/15 text-white ring-1 ring-sky-400/30"
                        : "text-mute hover:bg-hl hover:text-white"
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

        <PlantaDropdown
          activePlanta={activePlanta}
          availableOptions={availableOptions}
          isAdmin={isAdmin}
          pathname={pathname}
          searchParams={searchParams}
          router={router}
        />

        <div className="shrink-0 border-t border-line p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/30 to-sky-500/20 text-sm font-bold text-orange-100 ring-1 ring-orange-400/30">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-strong">
                {user.name}
              </p>
              <p className="text-xs capitalize text-subtle">{user.role}</p>
            </div>
            <form action={signOut} className="shrink-0">
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-400/80 transition hover:bg-rose-500/10 hover:text-rose-300"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

function PlantaDropdown({
  activePlanta,
  availableOptions,
  isAdmin,
  pathname,
  searchParams,
  router,
}: {
  activePlanta: string;
  availableOptions: readonly { value: string; label: string }[];
  isAdmin: boolean;
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  router: ReturnType<typeof useRouter>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel =
    availableOptions.find((o) => o.value === activePlanta)?.label ?? activePlanta;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectPlanta(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("planta", value);
    router.replace(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  }

  return (
    <div className="shrink-0 border-t border-line px-3 py-3" ref={ref}>
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.04] p-3">
        <div className="mb-2 flex items-center gap-2">
          <Factory className="h-3.5 w-3.5 text-amber-400/80" strokeWidth={2.5} />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/70">
            Planta
          </span>
        </div>
        <div className="relative">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-amber-500/25 bg-nav/80 px-3.5 text-sm font-medium text-main outline-none transition hover:border-amber-400/40 hover:bg-hl focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/20"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
              >
                {activeLabel}
                <ChevronUp
                  className={`h-4 w-4 text-mute transition-transform duration-200 ${isOpen ? "" : "rotate-180"}`}
                  strokeWidth={2}
                />
              </button>

              {isOpen && (
                <div
                  className="absolute bottom-full left-0 z-50 mb-1 w-full overflow-hidden rounded-xl border border-line bg-card py-1 shadow-xl shadow-black/30"
                  role="listbox"
                >
                  {availableOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={option.value === activePlanta}
                      onClick={() => selectPlanta(option.value)}
                      className={`flex w-full items-center px-3.5 py-2.5 text-left text-sm transition ${
                        option.value === activePlanta
                          ? "font-semibold text-amber-400"
                          : "font-medium text-main hover:bg-hl hover:text-strong"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className="rounded-xl border border-line bg-field px-3.5 py-2.5"
              title="Solo un administrador puede cambiar de planta. La vista siempre usa tu planta asignada."
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-main">{activeLabel}</span>
                <Lock className="h-3.5 w-3.5 shrink-0 text-subtle" aria-hidden />
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-subtle">
                Planta asignada a tu cuenta. Pide a un administrador un cambio si aplica.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
