import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { listUsuariosAdmin } from "@/modules/usuarios/actions";
import { UsuariosAdminClient } from "@/modules/usuarios/components/UsuariosAdminClient";

export default async function UsuariosPage() {
  const user = await getUserProfile();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const res = await listUsuariosAdmin();
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        No se pudo cargar la lista de usuarios: {res.error}
      </div>
    );
  }

  return <UsuariosAdminClient initialRows={res.rows} currentUserId={user.id} />;
}
