"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Wallet, Building2, CreditCard, Smartphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { useCurrency } from "@/hooks/use-currency"
import { getAccounts, createAccount, updateAccount, deleteAccount } from "@/features/accounts/accounts"
import { formatCurrency } from "@/lib/utils"
import type { AccountType } from "@/types"

interface AccountItem {
  id: string
  name: string
  type: string
  balance: number
}

const typeIcons: Record<string, React.ReactNode> = {
  cash: <Wallet className="h-5 w-5" />,
  bank: <Building2 className="h-5 w-5" />,
  card: <CreditCard className="h-5 w-5" />,
  wallet: <Smartphone className="h-5 w-5" />,
}

const typeLabels: Record<string, string> = {
  cash: "Efectivo",
  bank: "Banco",
  card: "Tarjeta",
  wallet: "Billetera digital",
}

const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({ value, label }))

export default function AccountsPage() {
  const toast = useToast()
  const currency = useCurrency()
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AccountItem | null>(null)
  const [form, setForm] = useState({ name: "", type: "bank" as AccountType, balance: "" })

  const load = async () => {
    try { setAccounts(await getAccounts()) } catch { toast("Error al cargar cuentas", "error") } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const resetForm = () => { setForm({ name: "", type: "bank", balance: "" }); setEditing(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const balance = parseFloat(form.balance) || 0
      if (editing) await updateAccount(editing.id, { name: form.name, type: form.type, balance })
      else await createAccount({ name: form.name, type: form.type, balance })
      setShowModal(false); resetForm(); load()
    } catch { toast("Error al guardar cuenta", "error") }
  }

  const handleEdit = (a: AccountItem) => { setEditing(a); setForm({ name: a.name, type: a.type as AccountType, balance: String(a.balance) }); setShowModal(true) }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta?")) return
    try { await deleteAccount(id); load() } catch { toast("Error al eliminar cuenta", "error") }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Cuentas</h1>
          <p className="text-sm text-neutral-500">Tus cuentas y saldos</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Añadir
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <Card key={a.id} className="border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                    {typeIcons[a.type] ?? typeIcons.bank}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">{a.name}</p>
                    <p className="text-xs text-neutral-400">{typeLabels[a.type] ?? a.type}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(a)}><Pencil className="h-3.5 w-3.5 text-neutral-400" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5 text-neutral-400" /></Button>
                </div>
              </div>
              <p className="mt-3 text-lg font-semibold text-black">{formatCurrency(a.balance, currency)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card className="border"><CardContent className="py-12 text-center text-sm text-neutral-400">Aún no hay cuentas</CardContent></Card>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Editar cuenta" : "Nueva cuenta"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cuenta principal, Efectivo..." required />
          <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })} options={typeOptions} />
          <Input label="Saldo inicial" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0.00" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
