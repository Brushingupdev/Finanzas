import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export const registerSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  currency: z.enum(["USD", "EUR", "MXN", "COP", "ARS", "CLP", "PEN", "BRL"]),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>