"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AuthError, NotFoundError, ForbiddenError } from "@/lib/errors"

type PrismaModelName = "transaction" | "category" | "budget" | "subscription" | "account"

export async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new AuthError()
  return session.user.id
}

export async function ensureOwnership(
  model: PrismaModelName,
  id: string,
  userId: string
): Promise<void> {
  const modelDelegate = (prisma as unknown as Record<string, { findUnique: (args: { where: { id: string } }) => Promise<{ userId: string } | null> }>)[model]
  const record = await modelDelegate.findUnique({ where: { id } })
  if (!record) throw new NotFoundError()
  if (record.userId !== userId) throw new ForbiddenError()
}
