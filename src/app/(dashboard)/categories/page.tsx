"use client"

import { useEffect, useState } from "react"
import { Trash2, Pencil, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/features/categories/categories"
import { CATEGORY_COLORS } from "@/lib/constants"
import type { TransactionType } from "@/types"

interface CategoryItem {
  id: string
  name: string
  type: string
  color: string
}

export default function CategoriesPage() {
  const toast = useToast()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CategoryItem | null>(null)
  const [form, setForm] = useState({ name: "", type: "expense" as TransactionType, color: CATEGORY_COLORS[0] })

  const load = async () => {
    try { const data = await getCategories(); setCategories(data as CategoryItem[]) } catch { toast("Error al cargar categorías", "error") } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) await updateCategory(editing.id, form)
      else await createCategory(form)
      setShowModal(false); setEditing(null); setForm({ name: "", type: "expense", color: CATEGORY_COLORS[0] }); load()
    } catch { toast("Error al guardar categoría", "error") }
  }

  const handleEdit = (cat: CategoryItem) => { setEditing(cat); setForm({ name: cat.name, type: cat.type as TransactionType, color: cat.color }); setShowModal(true) }
  const handleDelete = async (id: string) => { if (!confirm("¿Eliminar?")) return; try { await deleteCategory(id); load() } catch { toast("Error al eliminar categoría", "error") } }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Categorías</h1>
          <p className="text-sm text-neutral-500">Ingresos y gastos</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", type: "expense", color: CATEGORY_COLORS[0] }); setShowModal(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Añadir
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="border">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <div>
                  <p className="text-sm font-medium text-black">{cat.name}</p>
                  <p className="text-xs text-neutral-400 capitalize">{cat.type === "income" ? "Ingreso" : "Gasto"}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}><Pencil className="h-3.5 w-3.5 text-neutral-400" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}><Trash2 className="h-3.5 w-3.5 text-neutral-400" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && <Card className="border"><CardContent className="py-12 text-center text-sm text-neutral-400">Aún no hay categorías</CardContent></Card>}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Editar" : "Nueva categoría"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })} options={[{ value: "expense", label: "Gasto" }, { value: "income", label: "Ingreso" }]} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-black">Color</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button key={color} type="button" className={`h-7 w-7 rounded-full border-2 transition-all ${form.color === color ? "border-black scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => setForm({ ...form, color })} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}