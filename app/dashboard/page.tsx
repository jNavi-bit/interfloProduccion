import { redirect } from "next/navigation";
import { getUserProfile, HomePage } from "@/modules/dashboard";
import { resolvePlantaForUser } from "@/modules/dashboard/plants";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ planta?: string | string[] }>;
}) {
  const user = await getUserProfile();
  if (!user) redirect("/login");
  const params = await searchParams;
  const requestedPlanta = Array.isArray(params.planta)
    ? params.planta[0]
    : params.planta;
  const planta = resolvePlantaForUser(user, requestedPlanta);

  return <HomePage user={user} planta={planta} />;
}
