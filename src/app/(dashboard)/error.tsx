"use client"

import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-neutral-900">Algo salió mal</h2>
        <p className="text-sm text-neutral-500">
          {error.message || "Ocurrió un error inesperado"}
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-black px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.97]"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
