import { AppShell } from "@/components/AppShell";
import { getDashboardData } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getDashboardData();
  return <AppShell data={data} />;
}
