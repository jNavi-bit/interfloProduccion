import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { resolvePlantaForUser } from "@/modules/dashboard/plants";
import { MetrosTotalesReport } from "@/modules/reportes/components/MetrosTotalesReport";

export default async function ReporteMetrosPage({
  searchParams,
}: {
  searchParams: Promise<{ planta?: string }>;
}) {
  const user = await getUserProfile();
  if (!user) redirect("/login");

  const params = await searchParams;
  const planta = resolvePlantaForUser(user, params.planta);

  return <MetrosTotalesReport planta={planta} />;
}
