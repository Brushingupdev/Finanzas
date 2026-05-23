"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Currency } from "@/types"
import { CURRENCIES } from "@/lib/constants"

export default function SettingsPage() {
  const [fullName, setFullName] = useState("")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) { const data = await res.json(); setFullName(data.name ?? ""); setCurrency(data.currency ?? "USD") }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage("")
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fullName, currency }) })
      if (!res.ok) throw new Error("Error"); setMessage("Guardado correctamente")
    } catch { setMessage("Error al guardar") }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" /></div>

  const currencyOptions = Object.entries(CURRENCIES).map(([value, { label, symbol }]) => ({ value, label: `${symbol} ${label}` }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Ajustes</h1>
        <p className="text-sm text-neutral-500">Preferencias de tu cuenta</p>
      </div>
      <Card className="border">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Perfil</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Select label="Moneda" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} options={currencyOptions} />
            {message && <p className={`text-sm ${message.includes("correctamente") ? "text-black" : "text-red-500"}`}>{message}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}