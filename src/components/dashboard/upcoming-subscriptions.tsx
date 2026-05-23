"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Currency } from "@/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Repeat, Plus } from "lucide-react"

interface UpcomingSubscriptionsProps {
  subscriptions: {
    id: string
    name: string
    amount: number
    billingCycle: string
    nextPaymentDate: string
    category: { id: string; name: string } | null
  }[]
  currency: Currency
}

export function UpcomingSubscriptions({ subscriptions, currency }: UpcomingSubscriptionsProps) {
  const router = useRouter()

  if (subscriptions.length === 0) {
    return (
      <Card className="border shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">
            Suscripciones
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Repeat className="h-10 w-10 text-neutral-200" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-neutral-600">No hay suscripciones</p>
              <p className="text-xs text-neutral-400">Registra tus pagos recurrentes</p>
            </div>
            <button
              onClick={() => router.push("/subscriptions")}
              className="mt-2 flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              Añadir suscripción
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
          Suscripciones
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-1">
          {subscriptions.map((s) => (
            <div
              key={s.id}
              className="group flex items-center justify-between rounded-xl px-3 py-3 transition-all hover:bg-neutral-50 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                  <Repeat className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-neutral-900">
                    {s.name}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {s.billingCycle === "monthly" ? "Mensual" : "Anual"} &middot; {formatDate(s.nextPaymentDate)}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-neutral-900 tabular-nums">
                {formatCurrency(s.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}