"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState } from "react"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Repeat,
  Tag,
  Settings,
  LogOut,
  Wallet,
  Building2,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/budgets", label: "Presupuestos", icon: PieChart },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
  { href: "/categories", label: "Categorías", icon: Tag },
  { href: "/accounts", label: "Cuentas", icon: Building2 },
  { href: "/settings", label: "Ajustes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background flex items-center justify-between px-4 pt-safe">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Finanzas</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static z-40 flex h-[100dvh] w-[240px] flex-col border-r bg-card transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5 pt-safe lg:pt-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Finanzas</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User / Logout */}
        <div className="border-t p-3 pb-safe lg:pb-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
              U
            </div>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}