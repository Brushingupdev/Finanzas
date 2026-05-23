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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black">
            <Wallet className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Finanzas</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static z-40 flex h-screen w-[240px] flex-col border-r bg-white transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Finanzas</span>
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
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-neutral-400")} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User / Logout */}
        <div className="border-t p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-700">
              U
            </div>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}