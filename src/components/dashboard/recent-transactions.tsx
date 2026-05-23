"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Currency } from "@/types"
import { ArrowUpRight, ArrowDownRight, Receipt, Plus } from "lucide-react"

interface RecentTransactionsProps {
  transactions: {
    id: string
    amount: number
    type: string
    description: string
    transactionDate: string
    category: { id: string; name: string; color: string } | null
  }[]
  currency: Currency
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  const router = useRouter()

  if (transactions.length === 0) {
    return (
      <Card className="border shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">
            Transacciones recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Receipt className="h-10 w-10 text-neutral-200" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-neutral-600">Aún no hay transacciones</p>
              <p className="text-xs text-neutral-400">Registra tu primera transacción para empezar</p>
            </div>
            <button
              onClick={() => router.push("/transactions")}
              className="mt-2 flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              Añadir transacción
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">
          Transacciones recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-1">
          {transactions.slice(0, 5).map((t) => (
            <div
              key={t.id}
              className="group flex items-center justify-between rounded-xl px-3 py-3 transition-all hover:bg-neutral-50 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    t.type === "income"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {t.type === "income" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-neutral-900">
                    {t.description}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {t.category?.name ?? "Sin categoría"} &middot; {formatDate(t.transactionDate)}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 text-[13px] font-semibold tabular-nums ${
                  t.type === "income" ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatCurrency(t.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}