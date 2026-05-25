import { getReportData } from "@/features/reports/reports"
import ReportsClient from "./reports-client"

export default async function ReportsPage() {
  try {
    const data = await getReportData()
    const serializedData = JSON.parse(JSON.stringify(data))
    return <ReportsClient initialData={serializedData} />
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    const errorStack = error instanceof Error ? error.stack : ""
    return (
      <div className="p-8 text-red-500">
        <h2 className="text-xl font-bold mb-4">Error en el Servidor (Reportes)</h2>
        <p className="mb-2">{errorMessage}</p>
        <pre className="text-xs bg-neutral-100 p-4 rounded overflow-auto max-w-full text-black">
          {errorStack}
        </pre>
      </div>
    )
  }
}
