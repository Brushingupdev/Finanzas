"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CURRENCIES } from "@/lib/constants"
import { register } from "@/features/auth/auth"
import type { Currency } from "@/types"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "", full_name: "", currency: "USD" as Currency })

  const currencyOptions = Object.entries(CURRENCIES).map(([value, { label, symbol }]) => ({ value, label: `${symbol} ${label}` }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await register(form)
      if (result.error) { setError(result.error); return }
      await signIn("credentials", { email: form.email, password: form.password, redirect: false })
      router.push("/dashboard"); router.refresh()
    } catch { setError("Error al registrarse") }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-black tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-neutral-500">Empieza a gestionar tus finanzas</p>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre completo" placeholder="Juan Pérez" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <Input label="Correo electrónico" type="email" placeholder="tu@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Contraseña" type="password" placeholder="••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Select label="Moneda" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })} options={currencyOptions} />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creando..." : "Continuar"}</Button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta? <Link href="/login" className="font-medium text-black hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}