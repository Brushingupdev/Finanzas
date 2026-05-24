"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Trash2, PauseCircle, PlayCircle, ScanLine } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { SubscriptionScanner } from "@/components/subscription-scanner"
import { getSubscriptions, createSubscription, deleteSubscription, updateSubscription } from "@/features/subscriptions/subscriptions"
import { getCategories } from "@/features/categories/categories"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useCurrency } from "@/hooks/use-currency"
import type { BillingCycle, SubscriptionStatus } from "@/types"

interface SubscriptionItem {
  id: string
  name: string
  amount: number
  billingCycle: string
  nextPaymentDate: Date | string
  status: string
  category: { id: string; name: string } | null
}

interface CategoryItem {
  id: string
  name: string
  type: string
  color: string
}

export default function SubscriptionsPage() {
  const toast = useToast()
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const currency = useCurrency()
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [filter, setFilter] = useState<SubscriptionStatus | "all">("all")
  const [form, setForm] = useState({
    name: "",
    amount: "",
    billing_cycle: "monthly" as BillingCycle,
    next_payment_date: new Date().toISOString().split("T")[0],
    category_id: "",
  })

  const load = useCallback(async () => {
    try {
      const [subData, catData] = await Promise.all([
        getSubscriptions(filter !== "all" ? (filter as SubscriptionStatus) : undefined),
        getCategories(),
      ])
      setSubscriptions(subData as SubscriptionItem[])
      setCategories(catData as CategoryItem[])
    } catch {
      toast("Error al cargar suscripciones", "error")
    } finally {
      setLoading(false)
    }
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSubscription({
        name: form.name,
        amount: parseFloat(form.amount),
        billing_cycle: form.billing_cycle,
        next_payment_date: form.next_payment_date,
        category_id: form.category_id || undefined,
      })
      setShowModal(false)
      setForm({ name: "", amount: "", billing_cycle: "monthly", next_payment_date: new Date().toISOString().split("T")[0], category_id: "" })
      toast("Suscripción creada")
      load()
    } catch {
      toast("Error al crear la suscripción", "error")
    }
  }

  const toggleStatus = async (sub: SubscriptionItem) => {
    const newStatus: SubscriptionStatus = sub.status === "active" ? "paused" : "active"
    try {
      await updateSubscription(sub.id, { status: newStatus })
      load()
    } catch {
      toast("Error al actualizar estado", "error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta suscripción?")) return
    try {
      await deleteSubscription(id)
      toast("Suscripción eliminada")
      load()
    } catch {
      toast("Error al eliminar la suscripción", "error")
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-neutral-100 text-black",
      paused: "bg-neutral-100 text-neutral-500",
      cancelled: "bg-neutral-100 text-neutral-400",
    }
    const labels: Record<string, string> = { active: "Activa", paused: "Pausada", cancelled: "Cancelada" }
    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[status] ?? ""}`}>
        {labels[status] ?? status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
      </div>
    )
  }

  const totalMonthly = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.billingCycle === "monthly" ? Number(s.amount) : Number(s.amount) / 12), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Suscripciones</h1>
          <p className="text-sm text-neutral-500">Total mensual: {formatCurrency(totalMonthly, currency)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowScanner(true)}>
            <ScanLine className="mr-2 h-4 w-4" /> Escanear
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Añadir
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "paused", "cancelled"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "primary" : "secondary"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "Todas" : f === "active" ? "Activas" : f === "paused" ? "Pausadas" : "Canceladas"}
          </Button>
        ))}
      </div>

      <div className="divide-y rounded-md border">
        {subscriptions.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-black">{s.name}</p>
                {statusBadge(s.status)}
              </div>
              <p className="text-xs text-neutral-400">
                {s.billingCycle === "monthly" ? "Mensual" : "Anual"} &middot;{" "}
                {formatDate(new Date(s.nextPaymentDate).toISOString().split("T")[0])}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-black">{formatCurrency(Number(s.amount), currency)}</span>
              <Button variant="ghost" size="sm" onClick={() => toggleStatus(s)}>
                {s.status === "active"
                  ? <PauseCircle className="h-4 w-4 text-neutral-400" />
                  : <PlayCircle className="h-4 w-4 text-neutral-400" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                <Trash2 className="h-3.5 w-3.5 text-neutral-400" />
              </Button>
            </div>
          </div>
        ))}
        {subscriptions.length === 0 && (
          <div className="py-12 text-center text-sm text-neutral-400">Aún no hay suscripciones</div>
        )}
      </div>

      {/* Manual form modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva suscripción">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Netflix, Spotify..." required />
          <Input label="Monto" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Select label="Frecuencia" value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value as BillingCycle })} options={[{ value: "monthly", label: "Mensual" }, { value: "yearly", label: "Anual" }]} />
          <Input label="Próximo pago" type="date" value={form.next_payment_date} onChange={(e) => setForm({ ...form, next_payment_date: e.target.value })} required />
          <Select label="Categoría" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} options={[{ value: "", label: "Sin categoría" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Crear</Button>
          </div>
        </form>
      </Modal>

      {/* Subscription scanner modal */}
      <SubscriptionScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onCreated={load}
        currency={currency}
        categories={categories}
      />
    </div>
  )
}
