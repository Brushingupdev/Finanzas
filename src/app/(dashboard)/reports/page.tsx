import { getReportData } from "@/features/reports/reports"
import ReportsClient from "./reports-client"

export default async function ReportsPage() {
  const data = await getReportData()
  
  // Serialize any potential Date objects to strings for the Client Component
  const serializedData = JSON.parse(JSON.stringify(data))
  
  return <ReportsClient initialData={serializedData} />
}
