"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { getBudgets, createBudget, deleteBudget } from "@/features/budgets/budgets"
import { getCategories } from "@/features/categories/categories"
import { formatCurrency } from "@/lib/utils"
import { useCurrency } from "@/hooks/use-currency"

interface BudgetItem {
  id: string
  month: number
  year: number
  plannedAmount: number
  spentAmount: number
  category: { id: string; name: string; color: string } | null
}

interface CategoryItem {
  id: string
  name: string
  type: string
  color: string
}

export default function BudgetsPage() {
  const toast = useToast()
  const currency = useCurrency()
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [form, setForm] = useState({ category_id: "", planned_amount: "" })

  const load = useCallback(async () => {
    try {
      const [budgetData, catData] = await Promise.all([
        getBudgets(selectedMonth, selectedYear),
        getCategories("expense"),
      ])
      setBudgets(budgetData as unknown as BudgetItem[])
      setCategories(catData as unknown as CategoryItem[])
    } catch {
      toast("Error al cargar los presupuestos", "error")
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBudget({
        category_id: form.category_id,
        month: selectedMonth,
        year: selectedYear,
        planned_amount: parseFloat(form.planned_amount),
      })
      setShowModal(false)
      setForm({ category_id: "", planned_amount: "" })
      toast("Presupuesto creado")
      load()
    } catch {
      toast("Error al crear el presupuesto", "error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este presupuesto?")) return
    try {
      await deleteBudget(id)
      toast("Presupuesto eliminado")
      load()
    } catch {
      toast("Error al eliminar el presupuesto", "error")
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString("es", { month: "long" }) }))
  const years = Array.from({ length: 5 }, (_, i) => ({ value: String(now.getFullYear() - 2 + i), label: String(now.getFullYear() - 2 + i) }))

  const totalPlanned = budgets.reduce((s, b) => s + Number(b.plannedAmount), 0)
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spentAmount), 0)

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Presupuestos</h1>
          <p className="text-sm text-neutral-500">Control de gastos mensuales</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="mr-2 h-4 w-4" /> Añadir</Button>
      </div>

      <div className="flex gap-2">
        <Select value={String(selectedMonth)} onChange={(e) => setSelectedMonth(Number(e.target.value))} options={months} />
        <Select value={String(selectedYear)} onChange={(e) => setSelectedYear(Number(e.target.value))} options={years} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="border"><CardContent className="p-4 space-y-1"><p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Planificado</p><p className="text-xl font-semibold text-black">{formatCurrency(totalPlanned, currency)}</p></CardContent></Card>
        <Card className="border"><CardContent className="p-4 space-y-1"><p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Gastado</p><p className={`text-xl font-semibold ${totalSpent > totalPlanned ? "text-red-500" : "text-black"}`}>{formatCurrency(totalSpent, currency)}</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {budgets.map((b) => {
          const percent = b.plannedAmount > 0 ? (b.spentAmount / b.plannedAmount) * 100 : 0
          const isOver = percent > 100
          return (
            <Card key={b.id} className="border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-black">{b.category?.name ?? "Desconocida"}</p>
                    <p className="text-xs text-neutral-400">{formatCurrency(b.spentAmount, currency)} / {formatCurrency(b.plannedAmount, currency)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isOver ? "text-red-500" : "text-black"}`}>{percent.toFixed(0)}%</span>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}><Trash2 className="h-3.5 w-3.5 text-neutral-400" /></Button>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all ${isOver ? "bg-red-500" : "bg-black"}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {budgets.length === 0 && <Card className="border"><CardContent className="py-12 text-center text-sm text-neutral-400">Aún no hay presupuestos</CardContent></Card>}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo presupuesto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Categoría" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} options={[{ value: "", label: "Selecciona una categoría" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
          <Input label="Monto planificado" type="number" step="0.01" value={form.planned_amount} onChange={(e) => setForm({ ...form, planned_amount: e.target.value })} required />
          <p className="text-xs text-neutral-400">{new Date(selectedYear, selectedMonth - 1).toLocaleString("es", { month: "long" })} {selectedYear}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}