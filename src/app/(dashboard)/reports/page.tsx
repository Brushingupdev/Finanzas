"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { getReportData } from "@/features/reports/reports"
import { formatCurrency } from "@/lib/utils"
import { useCurrency } from "@/hooks/use-currency"

interface ReportData {
  currency: string
  monthlyTrend: { month: string; income: number; expenses: number }[]
  categoryBreakdown: { name: string; amount: number; color: string; percentage: number }[]
  summary: { totalIncome: number; totalExpenses: number }
  allTransactions: { type: string; amount: number; date: string }[]
}

export default function ReportsPage() {
  const currency = useCurrency()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getReportData()
      .then((d) => setData(d as ReportData))
      .catch(() => setError("Error al cargar reportes"))
      .finally(() => setLoading(false))
  }, [])

  const handleExportCSV = () => {
    if (!data) return
    const header = "Tipo,Monto,Fecha\n"
    const rows = data.allTransactions
      .map((t) => `${t.type === "income" ? "Ingreso" : "Gasto"},${t.amount},${t.date}`)
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-red-500">{error || "Sin datos"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Reportes</h1>
          <p className="text-sm text-neutral-500">Análisis de 12 meses</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatCurrency(data.summary.totalIncome - data.summary.totalExpenses, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Ingresos del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-emerald-600">{formatCurrency(data.summary.totalIncome, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Gastos del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-red-500">{formatCurrency(data.summary.totalExpenses, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Tendencia anual</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={data.monthlyTrend} />
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Gastos por categoría (12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.categoryBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">Sin datos de gastos</p>
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-sm text-neutral-700">{cat.name}</span>
                  <span className="text-sm font-medium">{formatCurrency(cat.amount, currency)}</span>
                  <span className="w-10 text-right text-xs text-neutral-400">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
