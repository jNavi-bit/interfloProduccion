import { redirect } from "next/navigation";
import { getUserProfile, PlaceholderPage } from "@/modules/dashboard";

export default async function UsuariosPage() {
  const user = await getUserProfile();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <PlaceholderPage
      title="Administrar usuarios"
      description="Gestiona los usuarios del sistema, asigna roles y permisos."
    />
  );
}
