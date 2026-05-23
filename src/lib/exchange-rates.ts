"use server"

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number | null> {
  if (from === to) return amount

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    })

    if (!res.ok) return null

    const data = await res.json()
    const rates = data.rates as Record<string, number>
    const fromRate = rates[from]
    const toRate = rates[to]
    if (!fromRate || !toRate) return null

    // Convert via USD as base
    const inUsd = amount / fromRate
    return Math.round(inUsd * toRate * 100) / 100
  } catch {
    return null
  }
}
