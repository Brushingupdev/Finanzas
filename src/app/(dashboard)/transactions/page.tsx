"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Trash2, Pencil } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/features/transactions/transactions"
import { getCategories } from "@/features/categories/categories"
import { getAccounts } from "@/features/accounts/accounts"
import { formatCurrency, formatDate } from "@/lib/utils"
import { TRANSACTION_PAGE_SIZE } from "@/lib/constants"
import { useCurrency } from "@/hooks/use-currency"
import type { TransactionType } from "@/types"

interface TransactionItem {
  id: string
  amount: number
  type: string
  description: string
  transactionDate: Date | string
  categoryId?: string | null
  accountId?: string | null
  category: { id: string; name: string; color: string } | null
  account: { id: string; name: string; type: string } | null
}

interface CategoryItem {
  id: string
  name: string
  type: string
  color: string
}

interface AccountItem {
  id: string
  name: string
  type: string
  balance: number
}

const emptyForm = () => ({
  amount: "",
  type: "expense" as TransactionType,
  description: "",
  category_id: "",
  account_id: "",
  transaction_date: new Date().toISOString().split("T")[0],
})

export default function TransactionsPage() {
  const toast = useToast()
  const currency = useCurrency()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | TransactionType>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const load = useCallback(async (append = false) => {
    try {
      const params: Record<string, unknown> = {}
      if (filter !== "all") params.type = filter
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      if (append && nextCursor) params.cursor = nextCursor
      params.limit = TRANSACTION_PAGE_SIZE

      const [txResult, catData, accData] = await Promise.all([
        getTransactions(params as any),
        append ? Promise.resolve(null) : getCategories(),
        append ? Promise.resolve(null) : getAccounts(),
      ])

      const result = txResult as { data: TransactionItem[]; nextCursor: string | null }
      if (append) {
        setTransactions((prev) => [...prev, ...result.data])
      } else {
        setTransactions(result.data as TransactionItem[])
      }
      setNextCursor(result.nextCursor)
      if (catData) setCategories(catData as CategoryItem[])
      if (accData) setAccounts(accData as AccountItem[])
    } catch {
      toast("Error al cargar las transacciones", "error")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filter, dateFrom, dateTo, nextCursor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLoading(true); load() }, [filter, dateFrom, dateTo]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    setLoadingMore(true)
    load(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowModal(true)
  }

  const openEdit = (t: TransactionItem) => {
    setEditingId(t.id)
    setForm({
      amount: String(t.amount),
      type: t.type as TransactionType,
      description: t.description,
      category_id: t.categoryId ?? "",
      account_id: t.accountId ?? "",
      transaction_date: new Date(t.transactionDate).toISOString().split("T")[0],
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateTransaction(editingId, {
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description,
          categoryId: form.category_id || null,
          accountId: form.account_id || null,
          transactionDate: new Date(form.transaction_date),
        })
        toast("Transacción actualizada")
      } else {
        await createTransaction({
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description,
          category_id: form.category_id || undefined,
          account_id: form.account_id || undefined,
          transaction_date: form.transaction_date,
        })
        toast("Transacción creada")
      }
      setShowModal(false)
      setForm(emptyForm())
      load()
    } catch {
      toast("Error al guardar la transacción", "error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta transacción?")) return
    try {
      await deleteTransaction(id)
      toast("Transacción eliminada")
      load()
    } catch {
      toast("Error al eliminar la transacción", "error")
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Transacciones</h1>
          <p className="text-sm text-neutral-500">Registros de ingresos y gastos</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Añadir</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {(["all", "income", "expense"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "primary" : "secondary"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "Todas" : f === "income" ? "Ingresos" : "Gastos"}
          </Button>
        ))}
        <div className="h-5 w-px bg-neutral-200" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 rounded-md border border-neutral-200 px-2.5 text-xs text-neutral-600"
        />
        <span className="text-xs text-neutral-400">a</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 rounded-md border border-neutral-200 px-2.5 text-xs text-neutral-600"
        />
      </div>

      <div className="divide-y rounded-md border">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-black">{t.description}</p>
              <p className="text-xs text-neutral-400">
                {t.category?.name ?? "Sin categoría"}{t.account ? ` · ${t.account.name}` : ""} &middot; {formatDate(new Date(t.transactionDate).toISOString().split("T")[0])}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${t.type === "income" ? "text-black" : "text-neutral-500"}`}>
                {t.type === "income" ? "+" : "−"}{formatCurrency(Number(t.amount), currency)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                <Pencil className="h-3.5 w-3.5 text-neutral-400" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                <Trash2 className="h-3.5 w-3.5 text-neutral-400" />
              </Button>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="py-12 text-center text-sm text-neutral-400">Aún no hay transacciones</div>
        )}
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Editar transacción" : "Nueva transacción"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
            options={[{ value: "expense", label: "Gasto" }, { value: "income", label: "Ingreso" }]}
          />
          <Input
            label="Monto"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Input
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            options={[{ value: "", label: "Sin categoría" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Select
            label="Cuenta"
            value={form.account_id}
            onChange={(e) => setForm({ ...form, account_id: e.target.value })}
            options={[{ value: "", label: "Sin cuenta" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
          />
          <Input
            label="Fecha"
            type="date"
            value={form.transaction_date}
            onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">{editingId ? "Guardar cambios" : "Crear"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
