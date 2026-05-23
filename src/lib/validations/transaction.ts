import { z } from "zod"

export const transactionSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  type: z.enum(["income", "expense"]),
  description: z.string().min(1, "La descripción es obligatoria"),
  category_id: z.string().optional(),
  transaction_date: z.string().min(1, "La fecha es obligatoria"),
})

export type TransactionInput = z.infer<typeof transactionSchema>