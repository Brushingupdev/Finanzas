import { getDashboardStats } from "@/features/reports/reports"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  try {
    const stats = await getDashboardStats()
    const serializedStats = JSON.parse(JSON.stringify(stats))
    return <DashboardClient initialStats={serializedStats} />
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    const errorStack = error instanceof Error ? error.stack : ""
    return (
      <div className="p-8 text-red-500">
        <h2 className="text-xl font-bold mb-4">Error en el Servidor</h2>
        <p className="mb-2">{errorMessage}</p>
        <pre className="text-xs bg-neutral-100 p-4 rounded overflow-auto max-w-full text-black">
          {errorStack}
        </pre>
      </div>
    )
  }
}
