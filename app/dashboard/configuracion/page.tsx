import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { ConfiguracionClient } from "@/modules/configuracion/components/ConfiguracionClient";

export default async function ConfiguracionPage() {
  const user = await getUserProfile();
  if (!user) redirect("/login");

  return <ConfiguracionClient isAdmin={user.role === "admin"} />;
}
