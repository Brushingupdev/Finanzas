import { getReportData } from "@/features/reports/reports"
import ReportsClient from "./reports-client"

export default async function ReportsPage() {
  const data = await getReportData()
  return <ReportsClient initialData={data as any} />
}
