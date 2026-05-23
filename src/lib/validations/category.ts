import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  type: z.enum(["income", "expense"]),
  color: z.string().min(1, "El color es obligatorio"),
})

export type CategoryInput = z.infer<typeof categorySchema>