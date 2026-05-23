"use client"

import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BottomTabBar } from "@/components/dashboard/bottom-tab-bar"
import { ReceiptScanner } from "@/components/receipt-scanner"
import { ScannerProvider, useScanner } from "@/components/scanner-context"
import type { Currency } from "@/types"

interface DashboardShellProps {
  children: React.ReactNode
  categories: { id: string; name: string; type: string }[]
  currency: Currency
}

function DashboardShellInner({ children, categories, currency }: DashboardShellProps) {
  const { status } = useSession()
  const { open, closeScanner } = useScanner()

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 pb-16 lg:pt-0 lg:pb-0">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">{children}</div>
      </main>
      <BottomTabBar />
      <ReceiptScanner
        open={open}
        onClose={closeScanner}
        currency={currency}
        categories={categories}
      />
    </div>
  )
}

export function DashboardShell({ children, categories, currency }: DashboardShellProps) {
  return (
    <ScannerProvider>
      <DashboardShellInner categories={categories} currency={currency}>
        {children}
      </DashboardShellInner>
    </ScannerProvider>
  )
}
