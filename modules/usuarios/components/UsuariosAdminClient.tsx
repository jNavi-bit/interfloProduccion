"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";
import { PLANTA_OPTIONS, type PlantaValue } from "@/modules/dashboard/plants";
import type { UserRole } from "@/modules/dashboard/types";
import { vividFieldClassNames, vividSelectClassNames } from "@/lib/heroUiVivid";
import {
  listUsuariosAdmin,
  updateUsuarioAdmin,
  createUsuarioAdmin,
  deleteUsuarioAdmin,
  type UsuarioAdminRow,
} from "../actions";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "capturista", label: "Capturista" },
  { value: "admin", label: "Administrador" },
];

interface UsuariosAdminClientProps {
  initialRows: UsuarioAdminRow[];
  currentUserId: string;
}

export function UsuariosAdminClient({ initialRows, currentUserId }: UsuariosAdminClientProps) {
  const [rows, setRows] = useState<UsuarioAdminRow[]>(initialRows);
  const [drafts, setDrafts] = useState<Record<string, { name: string; role: UserRole; planta: PlantaValue }>>(
    () => buildDrafts(initialRows)
  );
  const [msg, setMsg] = useState<Record<string, string | null>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("capturista");
  const [newPlanta, setNewPlanta] = useState<PlantaValue>("llave2");

  const [deleteTarget, setDeleteTarget] = useState<UsuarioAdminRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const reload = useCallback(() => {
    setGlobalError(null);
    void listUsuariosAdmin().then((res) => {
      if (!res.ok) {
        setGlobalError(res.error);
        return;
      }
      setRows(res.rows);
      setDrafts(buildDrafts(res.rows));
    });
  }, []);

  const updateDraft = useCallback(
    (id: string, patch: Partial<{ name: string; role: UserRole; planta: PlantaValue }>) => {
      setDrafts((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
      setMsg((m) => ({ ...m, [id]: null }));
    },
    []
  );

  const save = useCallback(
    (id: string) => {
      const d = drafts[id];
      if (!d) return;
      setMsg((m) => ({ ...m, [id]: null }));
      startTransition(async () => {
        const res = await updateUsuarioAdmin({
          id,
          name: d.name,
          role: d.role,
          planta: d.planta,
        });
        if (!res.ok) {
          setMsg((m) => ({ ...m, [id]: res.error }));
          return;
        }
        setMsg((m) => ({ ...m, [id]: "Guardado." }));
        reload();
      });
    },
    [drafts, reload]
  );

  const dirty = useCallback(
    (r: UsuarioAdminRow) => {
      const d = drafts[r.id];
      if (!d) return false;
      return (
        d.name !== r.name ||
        d.role !== (r.role === "admin" ? "admin" : "capturista") ||
        d.planta !== normalizePlanta(r.planta)
      );
    },
    [drafts]
  );

  const createUser = useCallback(() => {
    setCreateMsg(null);
    startTransition(async () => {
      const res = await createUsuarioAdmin({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        planta: newPlanta,
      });
      if (!res.ok) {
        setCreateMsg(res.error);
        return;
      }
      setCreateMsg("Usuario creado. Deberá cambiar la contraseña al iniciar sesión.");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("capturista");
      setNewPlanta("llave2");
      reload();
    });
  }, [newName, newEmail, newPassword, newRole, newPlanta, reload]);

  const runDelete = useCallback(() => {
    if (!deleteTarget) return;
    setGlobalError(null);
    startTransition(async () => {
      const res = await deleteUsuarioAdmin(deleteTarget.id, deleteConfirm);
      if (!res.ok) {
        setGlobalError(res.error);
        return;
      }
      setDeleteTarget(null);
      setDeleteConfirm("");
      reload();
    });
  }, [deleteTarget, deleteConfirm, reload]);

  const sortedRows = useMemo(() => [...rows], [rows]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-mute transition hover:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15">
            <Users className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-strong">Administrar usuarios</h1>
            <p className="text-sm text-subtle">
              Alta en Auth con contraseña temporal (cambio obligatorio al primer acceso), edición de
              perfil y baja. Requiere{" "}
              <span className="font-mono text-mute">SUPABASE_SERVICE_ROLE_KEY</span> en el
              servidor para crear y eliminar.
            </p>
          </div>
        </div>
      </div>

      {globalError && (
        <Alert color="danger" variant="flat" title="Error" description={globalError} />
      )}

      <Card
        shadow="lg"
        radius="lg"
        className="gradient-ring-surface relative overflow-hidden border-0 shadow-xl shadow-blue-950/30"
      >
        <CardBody className="gap-4 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Plus className="h-5 w-5 text-sky-400" />
            Nuevo usuario
          </h2>
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              className="w-full min-w-0"
              label="Nombre para mostrar"
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              size="sm"
              color="primary"
              classNames={vividFieldClassNames}
              value={newName}
              onValueChange={setNewName}
              placeholder="Ej. Juan Pérez"
            />
            <Input
              className="w-full min-w-0 sm:col-span-2 lg:col-span-1"
              label="Correo (inicio de sesión)"
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              size="sm"
              type="email"
              color="secondary"
              classNames={vividFieldClassNames}
              value={newEmail}
              onValueChange={setNewEmail}
              placeholder="correo@empresa.com"
            />
            <Input
              className="w-full min-w-0"
              label="Contraseña temporal (mín. 8)"
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              size="sm"
              type="password"
              color="warning"
              classNames={vividFieldClassNames}
              value={newPassword}
              onValueChange={setNewPassword}
              autoComplete="new-password"
            />
            <Select
              className="w-full min-w-0"
              label="Rol"
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              size="sm"
              color="primary"
              classNames={vividSelectClassNames}
              disallowEmptySelection
              selectedKeys={new Set([newRole])}
              onSelectionChange={(keys) => {
                const k = Array.from(keys)[0] as UserRole | undefined;
                if (k) setNewRole(k);
              }}
            >
              {ROLES.map((o) => (
                <SelectItem key={o.value} textValue={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              className="w-full min-w-0"
              label="Planta"
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              size="sm"
              color="secondary"
              classNames={vividSelectClassNames}
              disallowEmptySelection
              selectedKeys={new Set([newPlanta])}
              onSelectionChange={(keys) => {
                const k = Array.from(keys)[0] as PlantaValue | undefined;
                if (k) setNewPlanta(k);
              }}
            >
              {PLANTA_OPTIONS.map((o) => (
                <SelectItem key={o.value} textValue={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              color="primary"
              radius="lg"
              className="bg-gradient-to-r from-sky-500 to-violet-600 font-semibold text-white shadow-lg shadow-sky-500/25"
              isDisabled={pending}
              onPress={() => void createUser()}
            >
              Crear usuario
            </Button>
            {createMsg && (
              <p
                className={`text-sm ${
                  createMsg.startsWith("Usuario creado") ? "text-success" : "text-danger"
                }`}
              >
                {createMsg}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="ui-table-wrap">
        <div className="overflow-x-auto">
        <table className="ui-table min-w-[800px]">
          <thead>
            <tr>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Planta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => {
              const d = drafts[r.id];
              if (!d) return null;
              const isSelf = r.id === currentUserId;
              const pendingPw = r.must_change_password === true;
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-sky-100">{r.email || "—"}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{r.id.slice(0, 8)}…</p>
                    {isSelf && (
                      <span className="mt-1 inline-block text-[10px] font-medium text-violet-600">Tú</span>
                    )}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 align-top">
                    <div className="min-w-0">
                      <Input
                        size="sm"
                        variant="bordered"
                        radius="md"
                        color="primary"
                        className="w-full min-w-0"
                        classNames={vividFieldClassNames}
                        value={d.name}
                        onValueChange={(v) => updateDraft(r.id, { name: v })}
                      />
                    </div>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 align-top">
                    <div className="min-w-0">
                    <Select
                      size="sm"
                      variant="bordered"
                      radius="md"
                      color="primary"
                      className="w-full min-w-0"
                      classNames={vividSelectClassNames}
                      disallowEmptySelection
                      selectedKeys={new Set([d.role])}
                      onSelectionChange={(keys) => {
                        const k = Array.from(keys)[0] as UserRole | undefined;
                        if (k) updateDraft(r.id, { role: k });
                      }}
                      aria-label="Rol"
                    >
                      {ROLES.map((o) => (
                        <SelectItem key={o.value} textValue={o.label}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </Select>
                    </div>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 align-top">
                    <div className="min-w-0">
                    <Select
                      size="sm"
                      variant="bordered"
                      radius="md"
                      color="secondary"
                      className="w-full min-w-0"
                      classNames={vividSelectClassNames}
                      disallowEmptySelection
                      selectedKeys={new Set([d.planta])}
                      onSelectionChange={(keys) => {
                        const k = Array.from(keys)[0] as PlantaValue | undefined;
                        if (k) updateDraft(r.id, { planta: k });
                      }}
                      aria-label="Planta"
                    >
                      {PLANTA_OPTIONS.map((o) => (
                        <SelectItem key={o.value} textValue={o.label}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </Select>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {pendingPw ? (
                      <span className="inline-flex rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                        Debe cambiar contraseña
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        radius="md"
                        className="font-medium"
                        isDisabled={pending || !dirty(r)}
                        onPress={() => save(r.id)}
                      >
                        Guardar
                      </Button>
                      {!isSelf && (
                        <Button
                          size="sm"
                          variant="bordered"
                          color="danger"
                          radius="md"
                          className="text-xs"
                          isDisabled={pending}
                          startContent={<Trash2 className="h-3 w-3" />}
                          onPress={() => {
                            setDeleteTarget(r);
                            setDeleteConfirm("");
                          }}
                        >
                          Eliminar
                        </Button>
                      )}
                      {msg[r.id] && (
                        <p
                          className={`text-xs ${
                            msg[r.id] === "Guardado." ? "text-emerald-400" : "text-rose-300"
                          }`}
                        >
                          {msg[r.id]}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {rows.length === 0 && !globalError && (
        <p className="text-center text-sm text-subtle">
          No hay usuarios en la tabla. Usa «Nuevo usuario» para dar de alta (requiere service role).
        </p>
      )}

      <Modal
        isOpen={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirm("");
          }
        }}
        placement="center"
        backdrop="blur"
        classNames={{ base: "border border-separator bg-surface" }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-foreground">Eliminar usuario</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              Se borrará la cuenta de{" "}
              <strong className="text-foreground">{deleteTarget?.email}</strong> en Auth y su fila en{" "}
              <span className="font-mono text-default-500">usuarios</span>. No se puede deshacer.
            </p>
            <Input
              label="Escribe ELIMINAR"
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              color="danger"
              classNames={vividFieldClassNames}
              value={deleteConfirm}
              onValueChange={setDeleteConfirm}
              autoComplete="off"
              placeholder="ELIMINAR"
              className="mt-2"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              radius="lg"
              onPress={() => {
                setDeleteTarget(null);
                setDeleteConfirm("");
              }}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              radius="lg"
              className="font-semibold"
              isDisabled={pending || deleteConfirm.trim() !== "ELIMINAR"}
              onPress={() => void runDelete()}
            >
              Eliminar definitivamente
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function buildDrafts(rows: UsuarioAdminRow[]) {
  const d: Record<string, { name: string; role: UserRole; planta: PlantaValue }> = {};
  for (const r of rows) {
    d[r.id] = {
      name: r.name,
      role: (r.role === "admin" ? "admin" : "capturista") as UserRole,
      planta: normalizePlanta(r.planta),
    };
  }
  return d;
}

function normalizePlanta(p: string | null): PlantaValue {
  if (p === "periferico" || p === "perisur" || p === "llave2") return p;
  return "llave2";
}
