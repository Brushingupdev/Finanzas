"use client"

import Image from "next/image"
import { useState, useRef, useCallback } from "react"
import { createSubscription } from "@/features/subscriptions/subscriptions"
import { scanImage } from "@/lib/ai-scanner"
import { convertCurrency } from "@/lib/exchange-rates"
import { resizeForUpload, dataUrlToBase64 } from "@/lib/image-utils"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import type { Currency } from "@/types"
import { Camera, Check, Loader2, ImagePlus, RefreshCw, PenLine, AlertCircle, Repeat2, Sparkles } from "lucide-react"

interface SubscriptionScannerProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  currency: Currency
  categories: { id: string; name: string; type: string }[]
}

type ScanState = "idle" | "scanning" | "confirm" | "saving" | "done"

const emptyForm = () => ({
  name: "", amount: "", billing_cycle: "monthly" as "monthly" | "yearly",
  next_payment_date: new Date().toISOString().split("T")[0], category_id: "",
})

export function SubscriptionScanner({ open, onClose, onCreated, currency, categories }: SubscriptionScannerProps) {
  const toast = useToast()
  const [state, setState] = useState<ScanState>("idle")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [aiData, setAiData] = useState<{ name: string | null; amount: number | null; currency: string | null; billingCycle: "monthly" | "yearly" | null; nextPaymentDate: string | null } | null>(null)
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState("")

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setState("idle"); setPreviewUrl(null); setAiData(null); setConvertedAmount(null); setError(""); setForm(emptyForm())
  }, [])

  const handleClose = () => { reset(); onClose() }
  const goToManual = useCallback(() => { setAiData(null); setError(""); setState("confirm") }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Por favor selecciona una imagen"); return }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setState("scanning")
    setError("")

    try {
      const resized = await resizeForUpload(url)
      const { base64, mimeType } = dataUrlToBase64(resized)
      const result = await scanImage(base64, mimeType, categories)

      setAiData({
        name: result.name ?? result.description,
        amount: result.amount,
        currency: result.currency,
        billingCycle: result.billingCycle,
        nextPaymentDate: result.nextPaymentDate ?? result.date,
      })

      // Convert currency if detected currency differs from user's currency
      let displayAmount = result.amount?.toFixed(2) ?? ""
      if (result.amount && result.currency && result.currency !== currency) {
        const converted = await convertCurrency(result.amount, result.currency, currency)
        if (converted) {
          setConvertedAmount(converted)
          displayAmount = converted.toFixed(2)
        }
      }

      setForm({
        name: result.name ?? result.description ?? "",
        amount: displayAmount,
        billing_cycle: result.billingCycle ?? "monthly",
        next_payment_date: result.nextPaymentDate ?? result.date ?? new Date().toISOString().split("T")[0],
        category_id: result.categoryId ?? "",
      })
      setState("confirm")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar la imagen")
      goToManual()
    }
  }, [goToManual, categories, currency])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ""
  }

  const handleSave = async () => {
    if (!form.name || !form.amount) { setError("Completa nombre y monto"); return }
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) { setError("Monto inválido"); return }

    setState("saving"); setError("")
    try {
      await createSubscription({
        name: form.name, amount,
        billing_cycle: form.billing_cycle,
        next_payment_date: form.next_payment_date,
        category_id: form.category_id || undefined,
        status: "active",
      })
      setState("done")
      toast("Suscripción registrada")
      onCreated()
      setTimeout(handleClose, 1200)
    } catch {
      setError("Error al guardar. Intenta de nuevo.")
      setState("confirm")
    }
  }

  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <Modal open={open} onClose={handleClose} title="Nueva suscripción" description="Escaneá una captura de pantalla o ingresá manualmente">
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <p className="text-[12px] text-amber-700">{error}</p>
          </div>
        )}

        {state === "idle" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
              <Repeat2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-neutral-700">Capturá una página de billing</p>
              <p className="text-xs text-neutral-400">Gemini extrae nombre, monto, ciclo y fecha</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-3 justify-center">
                <button onClick={() => cameraRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.97]">
                  <Camera className="h-4 w-4" /> Cámara
                </button>
                <button onClick={() => galleryRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-700 transition-all hover:bg-neutral-50 active:scale-[0.97]">
                  <ImagePlus className="h-4 w-4" /> Galería / Captura
                </button>
              </div>
              <button onClick={goToManual} className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white py-2.5 text-[13px] font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700">
                <PenLine className="h-4 w-4" /> Ingresar manualmente
              </button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
        )}

        {state === "scanning" && (
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative overflow-hidden rounded-xl border border-neutral-200">
                <Image
                  src={previewUrl}
                  alt="Captura"
                  width={1200}
                  height={700}
                  unoptimized
                  className="w-full max-h-[220px] object-contain bg-neutral-50"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                  <Sparkles className="h-7 w-7 animate-pulse text-white" />
                  <p className="mt-2 text-sm font-medium text-white">Analizando con Gemini...</p>
                </div>
              </div>
            )}
            <button onClick={goToManual} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white py-2 text-[12px] font-medium text-neutral-500 hover:bg-neutral-50">
              <PenLine className="h-3.5 w-3.5" /> Omitir e ingresar manualmente
            </button>
          </div>
        )}

        {(state === "confirm" || state === "saving") && (
          <div className="space-y-4">
            {aiData && (
              <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-3 py-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Detectado por IA</p>
                </div>
                {[
                  { label: "Nombre", value: aiData.name },
                  { label: "Monto detectado", value: aiData.amount != null ? `${aiData.currency ?? "$"} ${aiData.amount}` : null },
                  ...(convertedAmount && aiData.currency && aiData.currency !== currency
                    ? [{ label: `Convertido a ${currency}`, value: formatCurrency(convertedAmount, currency) }]
                    : []),
                  { label: "Ciclo", value: aiData.billingCycle === "monthly" ? "Mensual" : aiData.billingCycle === "yearly" ? "Anual" : null },
                  { label: "Próximo pago", value: aiData.nextPaymentDate },
                ].map(({ label, value }) => value != null ? (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-500">{label}</span>
                    <span className="text-[13px] font-medium truncate max-w-[200px]">{value}</span>
                  </div>
                ) : null)}
              </div>
            )}
            <div className="space-y-3">
              <Input label="Nombre del servicio" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Netflix, Spotify, Claude..." />
              <Input label={convertedAmount ? `Monto (${currency})` : "Monto"} type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--foreground)]">Frecuencia</label>
                <select value={form.billing_cycle} onChange={(e) => setForm((f) => ({ ...f, billing_cycle: e.target.value as "monthly" | "yearly" }))} className="flex h-10 w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2">
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <Input label="Próximo pago" type="date" value={form.next_payment_date} onChange={(e) => setForm((f) => ({ ...f, next_payment_date: e.target.value }))} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--foreground)]">Categoría</label>
                <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="flex h-10 w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2">
                  <option value="">Sin categoría</option>
                  {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              {previewUrl && (
                <button onClick={() => { setState("idle"); setError("") }} disabled={state === "saving"} className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button onClick={handleSave} disabled={state === "saving"} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black py-2.5 text-[13px] font-medium text-white hover:bg-neutral-800 active:scale-[0.97] disabled:opacity-50">
                {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {state === "saving" ? "Guardando..." : "Guardar suscripción"}
              </button>
            </div>
          </div>
        )}

        {state === "done" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-900">Suscripción registrada</p>
              <p className="text-xs text-neutral-400 mt-0.5">Ya aparece en tu lista</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
