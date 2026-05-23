"use client"

import { useState, useEffect } from "react"
import type { Currency } from "@/types"

export function useCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>("USD")

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.currency) setCurrency(d.currency as Currency) })
      .catch(() => {})
  }, [])

  return currency
}
