import { z } from "zod"

export const subscriptionSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  billing_cycle: z.enum(["monthly", "yearly"]),
  next_payment_date: z.string().min(1, "La fecha del próximo pago es obligatoria"),
  category_id: z.string().optional(),
  status: z.enum(["active", "paused", "cancelled"]).default("active"),
})

export type SubscriptionInput = z.infer<typeof subscriptionSchema>