"use client"

import { useEffect, useState } from "react"

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setShowInstall(false)
    setDeferredPrompt(null)
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:w-80 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-black">Instalar app</p>
          <p className="text-xs text-neutral-400">Accede rápido desde tu inicio</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setShowInstall(false)}
          className="flex-1 rounded-lg border border-neutral-200 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Ahora no
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 rounded-lg bg-black py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
        >
          Instalar
        </button>
      </div>
    </div>
  )
}
