export type Currency = "USD" | "EUR" | "MXN" | "COP" | "ARS" | "CLP" | "PEN" | "BRL"

export type TransactionType = "income" | "expense"

export type BillingCycle = "monthly" | "yearly"

export type AccountType = "cash" | "bank" | "card" | "wallet"

export type SubscriptionStatus = "active" | "paused" | "cancelled"

export interface DashboardStats {
  currency: Currency
  totalIncome: number
  totalExpenses: number
  balance: number
  recentTransactions: {
    id: string
    amount: number
    type: string
    description: string
    transactionDate: Date
    category: { id: string; name: string; color: string } | null
  }[]
  expensesByCategory: { name: string; amount: number; color: string }[]
  monthlyTrend: { month: string; income: number; expenses: number }[]
  upcomingSubscriptions: {
    id: string
    name: string
    amount: number
    billingCycle: string
    nextPaymentDate: Date
    category: { id: string; name: string } | null
  }[]
  budgetSummary: { category: string; planned: number; spent: number }[]
  paymentAlerts: {
    id: string
    name: string
    amount: number
    nextPaymentDate: Date
    daysUntil: number
    category: { id: string; name: string } | null
  }[]
}