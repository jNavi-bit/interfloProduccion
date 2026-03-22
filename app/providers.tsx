"use client";

import type { PropsWithChildren } from "react";
import NextTopLoader from "nextjs-toploader";
import { HeroUIProvider, ToastProvider } from "@heroui/react";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <HeroUIProvider locale="es-MX">
      <NextTopLoader showSpinner={false} color="#22d3ee" />
      <ToastProvider />
      {children}
    </HeroUIProvider>
  );
}
