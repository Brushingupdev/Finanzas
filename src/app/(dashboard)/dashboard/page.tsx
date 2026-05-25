import { getDashboardStats } from "@/features/reports/reports"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  // We serialize dates to strings as they come from the server to the client
  return <DashboardClient initialStats={stats as any} />
}
