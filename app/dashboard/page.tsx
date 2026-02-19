import { redirect } from "next/navigation";
import { getUserProfile, HomePage } from "@/modules/dashboard";

export default async function DashboardPage() {
  const user = await getUserProfile();
  if (!user) redirect("/login");

  return <HomePage user={user} />;
}
