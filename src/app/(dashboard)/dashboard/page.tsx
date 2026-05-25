"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { ExpensesChart } from "@/components/dashboard/expenses-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { UpcomingSubscriptions } from "@/components/dashboard/upcoming-subscriptions"
import { PaymentAlert } from "@/components/dashboard/payment-alert"
import { useScanner } from "@/components/scanner-context"
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
        const res = await fetch("/api/dashboard/stats", { method: "GET", cache: "no-store" })
        if (res.status === 401) {
          router.replace("/login")
          return
        }

        const contentType = res.headers.get("content-type") ?? ""
        if (!contentType.includes("application/json")) {
          throw new Error("Respuesta inválida del servidor")
        }

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || "Error al cargar el panel")
        }
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el panel")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

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
    <div className="space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Panel</h1>
          <p className="text-[13px] text-muted-foreground capitalize">{monthName} {year} &middot; Resumen de tus finanzas</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={openScanner}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.97]"
          >
            <Camera className="h-4 w-4" />
            Escanear recibo
          </button>
          <button
            onClick={() => router.push("/transactions")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.97]"
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
      <div className="fixed bottom-20 right-6 z-30 flex flex-col items-end gap-3 sm:hidden">
        <button
          onClick={openScanner}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-foreground shadow-lg border border-border transition-transform hover:scale-105 active:scale-95"
        >
          <Camera className="h-5 w-5" />
        </button>
        <button
          onClick={() => router.push("/transactions")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
  }
