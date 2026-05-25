import { getDashboardStats } from "@/features/reports/reports"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  
  // Serialize Prisma Date objects to strings as they cross the Server/Client boundary
  const serializedStats = JSON.parse(JSON.stringify(stats))
  
  return <DashboardClient initialStats={serializedStats} />
}
