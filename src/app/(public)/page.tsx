import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-base font-semibold tracking-tight">Finanzas</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-neutral-500 hover:text-black transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register">
              <Button>Empezar gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6">
        <section className="mx-auto max-w-2xl py-32 text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-black">
            Tus finanzas, simples.
          </h1>
          <p className="mt-5 text-lg text-neutral-500">
            Registra ingresos, gastos y presupuestos. Sin complicaciones.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register">
              <Button size="lg">Crear cuenta</Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl border-t py-20">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: "Registra todo", desc: "Ingresos, gastos, suscripciones y presupuestos organizados." },
              { title: "Visualiza", desc: "Gráficos limpios de tus tendencias mensuales y gastos por categoría." },
              { title: "Tus datos", desc: "Base de datos propia. Sin bloqueos. Control total." },
            ].map((f) => (
              <div key={f.title} className="space-y-2">
                <h3 className="text-base font-medium text-black">{f.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-neutral-400">
        Finanzas
      </footer>
    </div>
  )
}