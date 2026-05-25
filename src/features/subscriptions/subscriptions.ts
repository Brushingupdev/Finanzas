"use server"

import { prisma } from "@/lib/prisma"
import { getUserId, ensureOwnership } from "@/lib/auth-helpers"
import { subscriptionSchema } from "@/lib/validations/subscription"
import type { SubscriptionStatus } from "@/types"

export async function getSubscriptions(status?: SubscriptionStatus) {
  const userId = await getUserId()

  const where: Record<string, unknown> = { userId }
  if (status) where.status = status

  return prisma.subscription.findMany({
    where,
    include: { category: true },
    orderBy: { nextPaymentDate: "asc" },
  })
}

export async function createSubscription(input: {
  name: string
  amount: number
  billing_cycle: string
  next_payment_date: string
  category_id?: string
  status?: SubscriptionStatus
}) {
  const userId = await getUserId()
  const validated = subscriptionSchema.parse(input)

  return prisma.subscription.create({
    data: {
      userId,
      name: validated.name,
      amount: validated.amount,
      billingCycle: validated.billing_cycle,
      nextPaymentDate: new Date(validated.next_payment_date),
      categoryId: validated.category_id || null,
      status: validated.status,
    },
    include: { category: true },
  })
}

export async function updateSubscription(
  id: string,
  input: {
    name?: string
    amount?: number
    billingCycle?: string
    nextPaymentDate?: Date
    categoryId?: string | null
    status?: SubscriptionStatus
  }
) {
  const userId = await getUserId()
  await ensureOwnership("subscription", id, userId)

  return prisma.subscription.update({
    where: { id },
    data: input,
    include: { category: true },
  })
}

export async function deleteSubscription(id: string) {
  const userId = await getUserId()
  await ensureOwnership("subscription", id, userId)

  return prisma.subscription.delete({ where: { id } })
}

export async function markSubscriptionPaid(id: string) {
  const userId = await getUserId()
  await ensureOwnership("subscription", id, userId)

  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: { category: true },
  })
  if (!sub) throw new Error("Suscripción no encontrada")

  const today = new Date()

  // Calculate next payment date
  const currentNext = new Date(sub.nextPaymentDate)
  const nextDate = new Date(currentNext)
  if (sub.billingCycle === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1)
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }

  return prisma.$transaction(async (tx) => {
    // Create transaction for this payment
    await tx.transaction.create({
      data: {
        userId,
        amount: sub.amount,
        type: "expense",
        description: sub.name,
        categoryId: sub.categoryId,
        transactionDate: today,
      },
    })

    return tx.subscription.update({
      where: { id },
      data: { nextPaymentDate: nextDate },
      include: { category: true },
    })
  })
}

export async function postponeSubscription(id: string, days = 7) {
  const userId = await getUserId()
  await ensureOwnership("subscription", id, userId)

  const sub = await prisma.subscription.findUnique({ where: { id } })
  if (!sub) throw new Error("Suscripción no encontrada")

  const nextDate = new Date(sub.nextPaymentDate)
  nextDate.setDate(nextDate.getDate() + days)

  return prisma.subscription.update({
    where: { id },
    data: { nextPaymentDate: nextDate },
    include: { category: true },
  })
}