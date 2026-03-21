import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { resolvePlantaForUser } from "@/modules/dashboard/plants";
import { EntregaPtClient, getEntregaPtRowsLatest } from "@/modules/entregaPt";

export default async function EntregaPtPage({
  searchParams,
}: {
  searchParams: Promise<{ planta?: string }>;
}) {
  const user = await getUserProfile();
  if (!user) redirect("/login");

  const params = await searchParams;
  const planta = resolvePlantaForUser(user, params.planta);

  const INITIAL_PAGE_SIZE = 60;
  const { rows: initialRows, hasMoreOlder: initialHasMoreOlder } =
    await getEntregaPtRowsLatest(planta, INITIAL_PAGE_SIZE + 1);

  return (
    <EntregaPtClient
      key={planta}
      planta={planta}
      initialRows={initialRows}
      initialHasMoreOlder={initialHasMoreOlder}
    />
  );
}
