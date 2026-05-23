"use server"

import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth-helpers"
import type { Currency } from "@/types"
import { getMonthName } from "@/lib/utils"

export async function getDashboardStats() {
  const userId = await getUserId()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Fetch all data in parallel
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [user, currentMonthTransactions, allSixMonthTransactions, expenseCategories, budgets, subscriptions] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true },
      }),
      prisma.transaction.findMany({
        where: { userId, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
        include: { category: true },
        orderBy: { transactionDate: "desc" },
      }),
      prisma.transaction.findMany({
        where: { userId, transactionDate: { gte: sixMonthsAgo, lte: endOfMonth } },
        select: { type: true, amount: true, transactionDate: true },
      }),
      prisma.category.findMany({ where: { userId, type: "expense" } }),
      prisma.budget.findMany({
        where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
        include: { category: true },
      }),
      prisma.subscription.findMany({
        where: { userId, status: "active" },
        include: { category: true },
        orderBy: { nextPaymentDate: "asc" },
      }),
    ])

  const currency = (user?.currency ?? "USD") as Currency

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const expensesByCategory = expenseCategories
    .map((cat) => {
      const amount = currentMonthTransactions
        .filter((t) => t.type === "expense" && t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0)
      return { name: cat.name, amount, color: cat.color }
    })
    .filter((c) => c.amount > 0)

  // Build monthly trend from a single pre-fetched dataset
  const monthlyTrend: { month: string; income: number; expenses: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yr = d.getFullYear()
    const mo = d.getMonth()

    const monthData = allSixMonthTransactions.filter((t) => {
      const td = new Date(t.transactionDate)
      return td.getFullYear() === yr && td.getMonth() === mo
    })

    monthlyTrend.push({
      month: getMonthName(mo + 1),
      income: monthData.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expenses: monthData.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    })
  }

  // Compute budget spent from already-fetched current-month transactions
  const budgetSummary = budgets.map((b) => {
    const spent = currentMonthTransactions
      .filter((t) => t.type === "expense" && t.categoryId === b.categoryId)
      .reduce((sum, t) => sum + t.amount, 0)
    return {
      category: b.category?.name ?? "Unknown",
      planned: b.plannedAmount,
      spent,
    }
  })

  // Detect subscriptions due within 7 days
  const sevenDaysFromNow = new Date(now)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const paymentAlerts = subscriptions
    .filter((s) => {
      const nextDate = new Date(s.nextPaymentDate)
      nextDate.setHours(0, 0, 0, 0)
      return nextDate >= today && nextDate <= sevenDaysFromNow
    })
    .map((s) => {
      const nextDate = new Date(s.nextPaymentDate)
      nextDate.setHours(0, 0, 0, 0)
      const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: s.id,
        name: s.name,
        amount: s.amount,
        nextPaymentDate: s.nextPaymentDate,
        daysUntil,
        category: s.category ? { id: s.category.id, name: s.category.name } : null,
      }
    })

  return {
    currency,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    recentTransactions: currentMonthTransactions.slice(0, 10),
    expensesByCategory,
    monthlyTrend,
    upcomingSubscriptions: subscriptions.slice(0, 5),
    budgetSummary,
    paymentAlerts,
  }
}

export async function getReportData() {
  const userId = await getUserId()

  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [user, transactions, expenseCategories] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
    prisma.transaction.findMany({
      where: { userId, transactionDate: { gte: twelveMonthsAgo, lte: endOfCurrentMonth } },
      select: { type: true, amount: true, transactionDate: true, categoryId: true },
    }),
    prisma.category.findMany({ where: { userId, type: "expense" }, select: { id: true, name: true, color: true } }),
  ])

  const currency = (user?.currency ?? "USD") as Currency

  // 12-month trend
  const monthlyTrend: { month: string; income: number; expenses: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yr = d.getFullYear()
    const mo = d.getMonth()

    const monthData = transactions.filter((t) => {
      const td = new Date(t.transactionDate)
      return td.getFullYear() === yr && td.getMonth() === mo
    })

    monthlyTrend.push({
      month: getMonthName(mo + 1),
      income: monthData.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expenses: monthData.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    })
  }

  // Category breakdown for all 12 months
  const categoryBreakdown = expenseCategories
    .map((cat) => {
      const total = transactions
        .filter((t) => t.type === "expense" && t.categoryId === cat.id)
        .reduce((s, t) => s + t.amount, 0)
      return { name: cat.name, amount: total, color: cat.color }
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const totalExpenses12m = categoryBreakdown.reduce((s, c) => s + c.amount, 0)

  // Summary for current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthTransactions = transactions.filter((t) => {
    const td = new Date(t.transactionDate)
    return td >= currentMonthStart
  })

  return {
    currency,
    monthlyTrend,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      ...c,
      percentage: totalExpenses12m > 0 ? Math.round((c.amount / totalExpenses12m) * 100) : 0,
    })),
    summary: {
      totalIncome: currentMonthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      totalExpenses: currentMonthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    },
    allTransactions: transactions.map((t) => ({
      type: t.type,
      amount: t.amount,
      date: new Date(t.transactionDate).toISOString().split("T")[0],
    })),
  }
}