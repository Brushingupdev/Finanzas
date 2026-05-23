"use server"

import { prisma } from "@/lib/prisma"
import { getUserId, ensureOwnership } from "@/lib/auth-helpers"
import { categorySchema } from "@/lib/validations/category"
import type { TransactionType } from "@/types"

export async function getCategories(type?: TransactionType) {
  const userId = await getUserId()

  const where: Record<string, unknown> = { userId }
  if (type) where.type = type

  return prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
  })
}

export async function createCategory(input: {
  name: string
  type: TransactionType
  color: string
}) {
  const userId = await getUserId()
  const validated = categorySchema.parse(input)

  return prisma.category.create({
    data: { ...validated, userId },
  })
}

export async function updateCategory(
  id: string,
  input: { name?: string; type?: TransactionType; color?: string }
) {
  const userId = await getUserId()
  await ensureOwnership("category", id, userId)

  return prisma.category.update({ where: { id }, data: input })
}

export async function deleteCategory(id: string) {
  const userId = await getUserId()
  await ensureOwnership("category", id, userId)

  return prisma.category.delete({ where: { id } })
}