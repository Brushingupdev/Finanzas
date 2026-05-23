"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getDashboardStats } from "@/features/reports/reports"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { ExpensesChart } from "@/components/dashboard/expenses-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { UpcomingSubscriptions } from "@/components/dashboard/upcoming-subscriptions"
import { PaymentAlert } from "@/components/dashboard/payment-alert"
import { useScanner } from "@/components/scanner-context"
import { getCategories } from "@/features/categories/categories"
import type { DashboardStats } from "@/types"
import { Plus, Camera } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { openScanner } = useScanner()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const now = new Date()
  const monthName = now.toLocaleString("es", { month: "long" })
  const year = now.getFullYear()

  useEffect(() => {
    async function load() {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el panel")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
          <p className="text-sm text-neutral-400">Cargando panel...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-red-500">{error || "Sin datos disponibles"}</p>
      </div>
    )
  }

  const formattedTransactions = stats.recentTransactions.map((t) => ({
    ...t,
    transactionDate: new Date(t.transactionDate).toISOString().split("T")[0],
    category: t.category ? { ...t.category } : null,
  }))

  const formattedSubscriptions = stats.upcomingSubscriptions.map((s) => ({
    ...s,
    nextPaymentDate: new Date(s.nextPaymentDate).toISOString().split("T")[0],
    billingCycle: s.billingCycle,
  }))

  const formattedAlerts = stats.paymentAlerts.map((a) => ({
    ...a,
    nextPaymentDate: new Date(a.nextPaymentDate).toISOString().split("T")[0],
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">Panel</h1>
          <p className="text-[13px] text-neutral-500 capitalize">{monthName} {year} &middot; Resumen de tus finanzas</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={openScanner}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 active:scale-[0.97]"
          >
            <Camera className="h-4 w-4" />
            Escanear recibo
          </button>
          <button
            onClick={() => router.push("/transactions")}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nueva transacción
          </button>
        </div>
      </div>

      {/* Payment Alerts */}
      <PaymentAlert alerts={formattedAlerts} currency={stats.currency} />

      {/* Stats */}
      <StatsCards
        income={stats.totalIncome}
        expenses={stats.totalExpenses}
        balance={stats.balance}
        currency={stats.currency}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <MonthlyChart data={stats.monthlyTrend} />
        <ExpensesChart data={stats.expensesByCategory} />
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <RecentTransactions transactions={formattedTransactions} currency={stats.currency} />
        <UpcomingSubscriptions subscriptions={formattedSubscriptions} currency={stats.currency} />
      </div>

      {/* Mobile FABs */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 sm:hidden">
        <button
          onClick={openScanner}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-800 shadow-lg border border-neutral-200 transition-transform hover:scale-105 active:scale-95"
        >
          <Camera className="h-5 w-5" />
        </button>
        <button
          onClick={() => router.push("/transactions")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}