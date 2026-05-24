"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signIn } from "@/lib/auth"
import { loginSchema, registerSchema, type LoginInput } from "@/lib/validations/auth"

export async function login(input: LoginInput) {
  const validated = loginSchema.parse(input)
  await signIn("credentials", {
    email: validated.email,
    password: validated.password,
    redirectTo: "/dashboard",
  })
}

export async function register(input: {
  email: string
  password: string
  full_name: string
  currency: string
}) {
  const validated = registerSchema.parse(input)

  const existing = await prisma.user.findUnique({
    where: { email: validated.email },
  })
  if (existing) {
    return { error: "Este correo ya está registrado" }
  }

  const hashedPassword = await bcrypt.hash(validated.password, 12)

  await prisma.user.create({
    data: {
      email: validated.email,
      name: validated.full_name,
      password: hashedPassword,
      currency: validated.currency,
    },
  })

  return { success: true }
}