import { AppShell } from "@/components/AppShell";
import { getDashboardData } from "@/lib/db";

export default async function Page() {
  const data = await getDashboardData();
  return <AppShell data={data} />;
}
