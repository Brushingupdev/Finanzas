"use client"

import * as React from "react"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  description?: string
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (open) { document.addEventListener("keydown", handleEsc); document.body.style.overflow = "hidden" }
    return () => { document.removeEventListener("keydown", handleEsc); document.body.style.overflow = "" }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-black">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-black transition-colors"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}