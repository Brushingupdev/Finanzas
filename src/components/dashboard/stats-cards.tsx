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
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "GASTOS",
      value: expenses,
      icon: TrendingDown,
      iconColor: "text-red-500",
      iconBg: "bg-red-50",
    },
    {
      label: "BALANCE",
      value: balance,
      icon: Wallet,
      iconColor: balance >= 0 ? "text-emerald-600" : "text-red-500",
      iconBg: balance >= 0 ? "bg-emerald-50" : "bg-red-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-2">
              <p className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-[24px] font-semibold tracking-tight text-neutral-900 tabular-nums">
                {formatCurrency(stat.value, currency)}
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}