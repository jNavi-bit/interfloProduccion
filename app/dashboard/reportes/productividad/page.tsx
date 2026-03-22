import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { resolvePlantaForUser } from "@/modules/dashboard/plants";
import { ProductividadReport } from "@/modules/reportes/components/ProductividadReport";

export default async function ReporteProductividadPage({
  searchParams,
}: {
  searchParams: Promise<{ planta?: string }>;
}) {
  const user = await getUserProfile();
  if (!user) redirect("/login");

  const params = await searchParams;
  const planta = resolvePlantaForUser(user, params.planta);

  return <ProductividadReport planta={planta} />;
}
