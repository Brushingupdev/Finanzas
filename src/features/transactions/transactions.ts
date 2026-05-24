"use server"

import { prisma } from "@/lib/prisma"
import { getUserId, ensureOwnership } from "@/lib/auth-helpers"
import { transactionSchema } from "@/lib/validations/transaction"
import type { TransactionType } from "@/types"

export async function getTransactions(params?: {
  type?: TransactionType
  month?: number
  year?: number
  limit?: number
  cursor?: string
  from?: string
  to?: string
}) {
  const userId = await getUserId()

  const where: Record<string, unknown> = { userId }
  if (params?.type) where.type = params.type

  if (params?.from || params?.to) {
    const dateFilter: Record<string, Date> = {}
    if (params.from) dateFilter.gte = new Date(params.from)
    if (params.to) dateFilter.lte = new Date(params.to + "T23:59:59.999Z")
    where.transactionDate = dateFilter
  }

  const take = params?.limit ?? 20
  const data = await prisma.transaction.findMany({
    where,
    include: { category: true, account: true },
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(params?.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  })

  const hasMore = data.length > take
  if (hasMore) data.pop()

  return { data, nextCursor: hasMore ? data[data.length - 1].id : null }
}

function balanceDelta(amount: number, type: string): number {
  return type === "income" ? amount : -amount
}

async function adjustAccountBalance(accountId: string, delta: number) {
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: { increment: delta } },
  })
}

export async function createTransaction(input: {
  amount: number
  type: TransactionType
  description: string
  category_id?: string
  account_id?: string
  transaction_date: string
}) {
  const userId = await getUserId()
  const validated = transactionSchema.parse(input)

  const tx = await prisma.transaction.create({
    data: {
      userId,
      amount: validated.amount,
      type: validated.type,
      description: validated.description,
      categoryId: validated.category_id || null,
      accountId: validated.account_id || null,
      transactionDate: new Date(validated.transaction_date),
    },
    include: { category: true, account: true },
  })

  if (validated.account_id) {
    await adjustAccountBalance(validated.account_id, balanceDelta(tx.amount, tx.type))
  }

  return tx
}

export async function updateTransaction(
  id: string,
  input: Partial<{
    amount: number
    type: TransactionType
    description: string
    categoryId: string | null
    accountId: string | null
    transactionDate: Date
  }>
) {
  const userId = await getUserId()
  await ensureOwnership("transaction", id, userId)

  const old = await prisma.transaction.findUnique({ where: { id }, select: { accountId: true, amount: true, type: true } })
  if (!old) throw new Error("Transacción no encontrada")

  const tx = await prisma.transaction.update({
    where: { id },
    data: input,
    include: { category: true, account: true },
  })

  // Revert old balance effect
  if (old.accountId) {
    await adjustAccountBalance(old.accountId, -balanceDelta(old.amount, old.type))
  }
  // Apply new balance effect
  if (tx.accountId) {
    await adjustAccountBalance(tx.accountId, balanceDelta(tx.amount, tx.type))
  }

  return tx
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId()
  await ensureOwnership("transaction", id, userId)

  const tx = await prisma.transaction.findUnique({ where: { id }, select: { accountId: true, amount: true, type: true } })
  if (!tx) throw new Error("Transacción no encontrada")

  await prisma.transaction.delete({ where: { id } })

  if (tx.accountId) {
    await adjustAccountBalance(tx.accountId, -balanceDelta(tx.amount, tx.type))
  }
}