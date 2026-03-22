"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@heroui/react";
import { KeyRound } from "lucide-react";
import { completeMandatoryPasswordChange, type CompletePasswordChangeResult } from "../actions";

type FormState = CompletePasswordChangeResult | null;

export function CambiarContrasenaForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const p = formData.get("password");
      const c = formData.get("confirm");
      if (typeof p !== "string" || typeof c !== "string") {
        return { ok: false, error: "Datos inválidos." };
      }
      return completeMandatoryPasswordChange(p, c);
    },
    null
  );

  return (
    <div className="rounded-2xl border border-separator bg-surface p-6 shadow-lg sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15">
          <KeyRound className="h-6 w-6 text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Nueva contraseña</h1>
          <p className="text-sm text-default-500">
            Por seguridad debes definir tu contraseña definitiva antes de continuar.
          </p>
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <Input
          id="np"
          name="password"
          type="password"
          label="Nueva contraseña"
          labelPlacement="outside-top"
          variant="bordered"
          radius="lg"
          autoComplete="new-password"
          isRequired
          minLength={8}
          isDisabled={isPending}
          placeholder="Mínimo 8 caracteres"
        />

        <Input
          id="npc"
          name="confirm"
          type="password"
          label="Confirmar contraseña"
          labelPlacement="outside-top"
          variant="bordered"
          radius="lg"
          autoComplete="new-password"
          isRequired
          minLength={8}
          isDisabled={isPending}
        />

        {state && !state.ok && (
          <Alert color="danger" variant="flat" title="No se pudo guardar" description={state.error} />
        )}

        <Button
          type="submit"
          color="primary"
          size="lg"
          radius="lg"
          className="min-h-12 w-full font-semibold"
          isLoading={isPending}
        >
          Guardar y continuar
        </Button>
      </form>
    </div>
  );
}
