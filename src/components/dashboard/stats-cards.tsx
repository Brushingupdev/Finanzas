"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { Currency } from "@/types"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface StatsCardsProps {
  income: number
  expenses: number
  balance: number
  currency: Currency
}

export function StatsCards({ income, expenses, balance, currency }: StatsCardsProps) {
  const stats = [
    {
      label: "INGRESOS",
      value: income,
      icon: TrendingUp,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "GASTOS",
      value: expenses,
      icon: TrendingDown,
      iconColor: "text-red-500 dark:text-red-400",
      iconBg: "bg-red-50 dark:bg-red-500/10",
    },
    {
      label: "BALANCE",
      value: balance,
      icon: Wallet,
      iconColor: balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
      iconBg: balance >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground tabular-nums">
                {formatCurrency(stat.value, currency)}
              </p>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}