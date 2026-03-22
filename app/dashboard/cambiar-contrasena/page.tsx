import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { CambiarContrasenaForm } from "@/modules/auth/components/CambiarContrasenaForm";

export default async function CambiarContrasenaPage() {
  const user = await getUserProfile();
  if (!user) redirect("/login");
  if (!user.mustChangePassword) {
    redirect("/dashboard");
  }

  return <CambiarContrasenaForm />;
}
