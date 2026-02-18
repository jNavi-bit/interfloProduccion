"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Evita errores de hidratación: no renderiza el contenido hasta que el cliente
 * haya montado (useEffect). Usar cuando la UI dependa de APIs del navegador
 * (localStorage, window, etc.) para que servidor y cliente no difieran.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
