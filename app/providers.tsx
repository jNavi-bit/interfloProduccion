"use client";

import type { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { ToastProvider } from "@heroui/react";

export default function Providers(props: PropsWithChildren) {
	return (
		<>
			<NextTopLoader showSpinner={false} color="blue" />
			<ThemeProvider attribute="class">
				<ToastProvider />
				{props.children}
			</ThemeProvider>
		</>
	);
}