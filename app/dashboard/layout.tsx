import { redirect } from "next/navigation";
import { getUserProfile, DashboardShell } from "@/modules/dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserProfile();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="dark min-h-full bg-app text-foreground">
      <DashboardShell user={user}>{children}</DashboardShell>
    </div>
  );
}
