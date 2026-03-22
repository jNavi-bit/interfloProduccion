"use client";

import { useState } from "react";
import { Tab, Tabs } from "@heroui/react";
import { ProductividadReglasEditor } from "./ProductividadReglasEditor";
import { MantenimientoDbPanel } from "./MantenimientoDbPanel";

type ConfigTab = "maquinas" | "mantenimiento";

interface ConfiguracionClientProps {
  isAdmin: boolean;
}

export function ConfiguracionClient({ isAdmin }: ConfiguracionClientProps) {
  const [tab, setTab] = useState<ConfigTab>("maquinas");

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-strong">Configuración</h1>
        <p className="mt-1 text-sm text-subtle">
          {isAdmin
            ? "Parámetros de productividad y herramientas de mantenimiento (solo administradores)."
            : "Consulta las reglas de productividad asignadas a tu planta."}
        </p>
      </div>

      {isAdmin ? (
        <>
          <Tabs
            aria-label="Secciones de configuración"
            color="primary"
            variant="underlined"
            selectedKey={tab}
            onSelectionChange={(k) => setTab(k as ConfigTab)}
            classNames={{
              tabList: "rounded-xl bg-surface/80 p-1 border border-separator",
              cursor: "bg-primary/20",
            }}
          >
            <Tab key="maquinas" title="Parámetros de máquinas" />
            <Tab key="mantenimiento" title="Mantenimiento de DB" />
          </Tabs>

          {tab === "maquinas" && <ProductividadReglasEditor isAdmin />}
          {tab === "mantenimiento" && <MantenimientoDbPanel />}
        </>
      ) : (
        <ProductividadReglasEditor isAdmin={false} />
      )}
    </div>
  );
}
