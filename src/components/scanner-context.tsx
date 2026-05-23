"use client"

import { createContext, useContext, useState, useCallback } from "react"

interface ScannerContextType {
  open: boolean
  openScanner: () => void
  closeScanner: () => void
}

const ScannerContext = createContext<ScannerContextType>({
  open: false,
  openScanner: () => {},
  closeScanner: () => {},
})

export function ScannerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openScanner = useCallback(() => setOpen(true), [])
  const closeScanner = useCallback(() => setOpen(false), [])

  return (
    <ScannerContext.Provider value={{ open, openScanner, closeScanner }}>
      {children}
    </ScannerContext.Provider>
  )
}

export function useScanner() {
  return useContext(ScannerContext)
}
