import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "./dashboard-shell"
import type { Currency } from "@/types"

import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [categories, user] = await Promise.all([
    prisma.category.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, type: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currency: true },
    }),
  ])

  return (
    <DashboardShell
      categories={categories}
      currency={(user?.currency ?? "USD") as Currency}
    >
      {children}
    </DashboardShell>
  )
}
