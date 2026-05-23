"use server"

import { prisma } from "@/lib/prisma"
import { getUserId, ensureOwnership } from "@/lib/auth-helpers"
import { accountSchema } from "@/lib/validations/account"

export async function getAccounts() {
  const userId = await getUserId()

  return prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createAccount(input: {
  name: string
  type: string
  balance?: number
}) {
  const userId = await getUserId()
  const validated = accountSchema.parse(input)

  return prisma.account.create({
    data: {
      userId,
      name: validated.name,
      type: validated.type,
      balance: validated.balance,
    },
  })
}

export async function updateAccount(
  id: string,
  input: { name?: string; type?: string; balance?: number }
) {
  const userId = await getUserId()
  await ensureOwnership("account", id, userId)

  return prisma.account.update({ where: { id }, data: input })
}

export async function deleteAccount(id: string) {
  const userId = await getUserId()
  await ensureOwnership("account", id, userId)

  return prisma.account.delete({ where: { id } })
}
