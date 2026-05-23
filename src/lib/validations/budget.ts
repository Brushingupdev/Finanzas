import { z } from "zod"

export const budgetSchema = z.object({
  category_id: z.string().min(1, "La categoría es obligatoria"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  planned_amount: z.coerce.number().positive("El monto debe ser positivo"),
})

export type BudgetInput = z.infer<typeof budgetSchema>