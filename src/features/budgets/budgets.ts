"use server"

import { prisma } from "@/lib/prisma"
import { getUserId, ensureOwnership } from "@/lib/auth-helpers"
import { budgetSchema } from "@/lib/validations/budget"


export async function getBudgets(month?: number, year?: number) {
  const userId = await getUserId()

  const where: Record<string, unknown> = { userId }
  if (month) where.month = month
  if (year) where.year = year

  const budgets = await prisma.budget.findMany({
    where,
    include: { category: true },
    orderBy: { year: "desc" },
  })

  if (budgets.length === 0) return budgets

  // Group budgets by period to batch the transaction queries
  const periods = [...new Set(budgets.map((b) => `${b.year}-${b.month}`))]
  const categoryIds = [...new Set(budgets.map((b) => b.categoryId))]

  // Map: "year-month-categoryId" → spent amount
  const spentMap = new Map<string, number>()

  for (const period of periods) {
    const [yr, mo] = period.split("-").map(Number)
    const startOfMonth = new Date(yr, mo - 1, 1)
    const endOfMonth = new Date(yr, mo, 0, 23, 59, 59, 999)

    const grouped = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        categoryId: { in: categoryIds },
        type: "expense",
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    })

    for (const g of grouped) {
      if (g.categoryId) {
        spentMap.set(`${yr}-${mo}-${g.categoryId}`, g._sum.amount ?? 0)
      }
    }
  }

  return budgets.map((b) => ({
    ...b,
    spentAmount: spentMap.get(`${b.year}-${b.month}-${b.categoryId}`) ?? 0,
  }))
}

export async function createBudget(input: {
  category_id: string
  month: number
  year: number
  planned_amount: number
}) {
  const userId = await getUserId()
  const validated = budgetSchema.parse(input)

  return prisma.budget.create({
    data: {
      userId,
      categoryId: validated.category_id,
      month: validated.month,
      year: validated.year,
      plannedAmount: validated.planned_amount,
    },
    include: { category: true },
  })
}

export async function updateBudget(
  id: string,
  input: { plannedAmount?: number }
) {
  const userId = await getUserId()
  await ensureOwnership("budget", id, userId)

  return prisma.budget.update({
    where: { id },
    data: input,
    include: { category: true },
  })
}

export async function deleteBudget(id: string) {
  const userId = await getUserId()
  await ensureOwnership("budget", id, userId)

  return prisma.budget.delete({ where: { id } })
}