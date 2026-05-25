"use client"

import { createContext, useContext } from "react"
import type { Currency } from "@/types"

const CurrencyContext = createContext<Currency>("USD")

export function CurrencyProvider({ currency, children }: { currency: Currency; children: React.ReactNode }) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): Currency {
  return useContext(CurrencyContext)
}
