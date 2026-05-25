"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Repeat,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/transactions", label: "Trans.", icon: ArrowLeftRight },
  { href: "/budgets", label: "Presup.", icon: PieChart },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/subscriptions", label: "Subs.", icon: Repeat },
]

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card pb-safe">
      <div className="flex h-14 items-center justify-around px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 rounded-lg transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
