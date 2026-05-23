"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false })
      if (result?.error) setError("Correo o contraseña incorrectos")
      else { router.push("/dashboard"); router.refresh() }
    } catch { setError("Error al iniciar sesión") }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-black tracking-tight">Bienvenido</h1>
          <p className="text-sm text-neutral-500">Inicia sesión en tu cuenta</p>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Correo electrónico" type="email" placeholder="tu@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Contraseña" type="password" placeholder="••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Iniciando..." : "Continuar"}</Button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          ¿No tienes cuenta? <Link href="/register" className="font-medium text-black hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}