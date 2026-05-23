import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { registerSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existing) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 400 })
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

    return NextResponse.json({ message: "Cuenta creada" }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al registrarse" }, { status: 500 })
  }
}