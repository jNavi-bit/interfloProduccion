import { redirect } from "next/navigation";
import { getUserProfile } from "@/modules/dashboard";
import { resolvePlantaForUser } from "@/modules/dashboard/plants";
import { CapturaProduccionClient, getProduccionRowsLatest } from "@/modules/captura";

export default async function CapturaPage({
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
    await getProduccionRowsLatest(planta, INITIAL_PAGE_SIZE + 1);

  return (
    <CapturaProduccionClient
      key={planta}
      planta={planta}
      initialRows={initialRows}
      initialHasMoreOlder={initialHasMoreOlder}
    />
  );
}
