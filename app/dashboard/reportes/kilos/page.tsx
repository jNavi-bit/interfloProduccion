import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { resolvePlantaForUser } from "@/modules/dashboard/plants";
import { KilosTotalesReport } from "@/modules/reportes/components/KilosTotalesReport";

export default async function ReporteKilosPage({
  searchParams,
}: {
  searchParams: Promise<{ planta?: string }>;
}) {
  const user = await getUserProfile();
  if (!user) redirect("/login");

  const params = await searchParams;
  const planta = resolvePlantaForUser(user, params.planta);

  return <KilosTotalesReport planta={planta} />;
}
