"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { markSubscriptionPaid, postponeSubscription } from "@/features/subscriptions/subscriptions"
import type { Currency } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle, CalendarClock, CheckCircle } from "lucide-react"

interface PaymentAlertProps {
  alerts: {
    id: string
    name: string
    amount: number
    nextPaymentDate: string
    daysUntil: number
    category: { id: string; name: string } | null
  }[]
  currency: Currency
}

export function PaymentAlert({ alerts, currency }: PaymentAlertProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [localAlerts, setLocalAlerts] = useState(alerts)

  if (localAlerts.length === 0) return null

  const totalDue = localAlerts.reduce((sum, a) => sum + a.amount, 0)

  const handlePaid = (id: string) => {
    startTransition(async () => {
      await markSubscriptionPaid(id)
      setLocalAlerts((prev) => prev.filter((a) => a.id !== id))
      router.refresh()
    })
  }

  const handlePostpone = (id: string) => {
    startTransition(async () => {
      await postponeSubscription(id, 7)
      setLocalAlerts((prev) => prev.filter((a) => a.id !== id))
      router.refresh()
    })
  }

  const dayLabel = (days: number) => {
    if (days === 0) return "Hoy"
    if (days === 1) return "Mañana"
    return `En ${days} días`
  }

  return (
    <Card className="border border-amber-200/60 bg-amber-50/50 shadow-sm">
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-semibold text-amber-900">
              Pagos próximos
            </h3>
            <p className="text-[12px] text-amber-700/80 mt-0.5">
              {localAlerts.length} suscripción{localAlerts.length > 1 ? "es" : ""} por un total de{" "}
              <span className="font-semibold tabular-nums">{formatCurrency(totalDue, currency)}</span>
            </p>
            <div className="mt-3 space-y-2">
              {localAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/70 border border-amber-100/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-neutral-900 truncate">
                      {alert.name}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {dayLabel(alert.daysUntil)} · {formatCurrency(alert.amount, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePostpone(alert.id)}
                      disabled={pending}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-all hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-50"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      Posponer
                    </button>
                    <button
                      onClick={() => handlePaid(alert.id)}
                      disabled={pending}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-amber-700 active:scale-[0.97] disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Ya pagué
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
