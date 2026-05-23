import { z } from "zod"

export const accountSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  type: z.enum(["cash", "bank", "card", "wallet"]),
  balance: z.coerce.number().default(0),
})

export type AccountInput = z.infer<typeof accountSchema>
