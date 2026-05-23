import type { Currency } from "@/types"

export const CURRENCIES: Record<Currency, { label: string; symbol: string }> = {
  USD: { label: "Dólar estadounidense", symbol: "$" },
  EUR: { label: "Euro", symbol: "€" },
  MXN: { label: "Peso mexicano", symbol: "$" },
  COP: { label: "Peso colombiano", symbol: "$" },
  ARS: { label: "Peso argentino", symbol: "$" },
  CLP: { label: "Peso chileno", symbol: "$" },
  PEN: { label: "Sol peruano", symbol: "S/" },
  BRL: { label: "Real brasileño", symbol: "R$" },
}

export const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
]

export const TRANSACTION_PAGE_SIZE = 20

export const DATE_FORMAT = "yyyy-MM-dd"
export const DISPLAY_DATE_FORMAT = "dd/MM/yyyy"