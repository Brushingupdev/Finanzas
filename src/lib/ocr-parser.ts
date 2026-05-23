export interface ParsedReceipt {
  amount: number | null
  amountConfidence: "high" | "low"
  date: string | null
  description: string | null
  rawText: string
}

function parseNumeric(raw: string): number | null {
  // Detect European format (1.234,56) vs US format (1,234.56)
  const lastDot = raw.lastIndexOf(".")
  const lastComma = raw.lastIndexOf(",")
  let cleaned: string

  if (lastComma > lastDot && raw.slice(lastComma + 1).length === 2) {
    cleaned = raw.replace(/\./g, "").replace(",", ".")
  } else {
    cleaned = raw.replace(/,/g, "")
  }

  const val = parseFloat(cleaned)
  return isNaN(val) || val <= 0 ? null : val
}

function extractAmount(text: string): { amount: number | null; confidence: "high" | "low" } {
  // Priority 1: labeled totals (high confidence)
  const labeledPatterns = [
    /(?:TOTAL\s*(?:A\s*PAGAR)?|GRAN\s+TOTAL|IMPORTE\s*(?:TOTAL)?|AMOUNT\s*(?:DUE)?|MONTO\s*TOTAL)\s*:?\s*[$€£S\/R$]?\s*([\d.,]+)/gi,
    /(?:SUBTOTAL|NETO)\s*:?\s*[$€£S\/R$]?\s*([\d.,]+)/gi,
  ]

  for (const pattern of labeledPatterns) {
    const matches = [...text.matchAll(pattern)]
    const candidates = matches
      .map((m) => parseNumeric(m[1]))
      .filter((v): v is number => v !== null && v < 1_000_000)

    if (candidates.length > 0) {
      return { amount: Math.max(...candidates), confidence: "high" }
    }
  }

  // Priority 2: currency-prefixed amounts
  const currencyPrefixed = [
    /[$€£]\s*([\d,]+\.\d{2})\b/g,
    /\b([\d.,]+)\s*[$€£]/g,
  ]

  let candidates: number[] = []
  for (const pattern of currencyPrefixed) {
    for (const m of text.matchAll(pattern)) {
      const val = parseNumeric(m[1])
      if (val !== null && val < 100_000) candidates.push(val)
    }
  }

  if (candidates.length > 0) {
    return { amount: Math.max(...candidates), confidence: "low" }
  }

  // Priority 3: any decimal number — least reliable
  const moneyRegex = /\b(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\b/g
  for (const m of text.matchAll(moneyRegex)) {
    const val = parseNumeric(m[1])
    if (val !== null && val < 100_000) candidates.push(val)
  }

  return candidates.length > 0
    ? { amount: Math.max(...candidates), confidence: "low" }
    : { amount: null, confidence: "low" }
}

function extractDate(text: string): string | null {
  const patterns = [
    /\b(\d{1,2})[\/\-.] (\d{1,2})[\/\-.](\d{2,4})\b/g,
    /\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g,
  ]

  for (const pattern of patterns) {
    for (const m of text.matchAll(pattern)) {
      let year: number, month: number, day: number
      if (m[1].length === 4) {
        ;[year, month, day] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]
      } else {
        ;[day, month, year] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]
        if (year < 100) year += 2000
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const d = new Date(year, month - 1, day)
        if (d.getFullYear() === year && d.getMonth() === month - 1) {
          return d.toISOString().split("T")[0]
        }
      }
    }
  }
  return null
}

const SKIP_WORDS = new Set([
  "total", "subtotal", "iva", "tax", "fecha", "date", "hora", "time",
  "cajero", "cashier", "ticket", "factura", "recibo", "receipt",
  "gracias", "thank", "tel", "phone", "rfc", "cuit", "nit", "nif",
  "calle", "street", "av.", "avenida", "www.", "http", "@", "#",
  "efectivo", "tarjeta", "cambio", "credito", "debito", "visa",
])

function extractDescription(text: string): string | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && l.length < 60)
    .filter((l) => {
      const lower = l.toLowerCase()
      const hasSkipWord = SKIP_WORDS.has(lower) || [...SKIP_WORDS].some((w) => lower.startsWith(w))
      const isPureNumber = /^[\d\s.,]+$/.test(l)
      const hasNoLetters = !/[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(l)
      const isUrlPath = /[a-zA-Z0-9]\/[a-zA-Z]/.test(l) // e.g. "claudeai/settings/billing"
      return !hasSkipWord && !isPureNumber && !hasNoLetters && !isUrlPath
    })

  if (lines.length === 0) return null

  // Pick the longest meaningful line (usually the store/item name near the top)
  const best = lines
    .slice(0, Math.min(lines.length, 8))
    .sort((a, b) => b.length - a.length)[0]

  return best.length > 80 ? best.slice(0, 80) : best
}

export function parseReceiptText(text: string): ParsedReceipt {
  const { amount, confidence } = extractAmount(text)
  return {
    amount,
    amountConfidence: confidence,
    date: extractDate(text),
    description: extractDescription(text),
    rawText: text,
  }
}

// ─── Subscription parsing ────────────────────────────────────────────────────

export interface ParsedSubscription {
  name: string | null
  nameConfidence: "high" | "low"
  amount: number | null
  billingCycle: "monthly" | "yearly" | null
  nextPaymentDate: string | null
  rawText: string
}

const MONTH_NAMES: Record<string, number> = {
  // Spanish
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
  // English
  january: 1, february: 2, march: 3, april: 4, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, apr: 4, aug: 8,
}

function parseNamedMonthDate(snippet: string): string | null {
  const monthPat = Object.keys(MONTH_NAMES).join("|")

  // "24 mayo 2026" | "24 de mayo de 2026"
  const re1 = new RegExp(`\\b(\\d{1,2})\\s+(?:de\\s+)?(${monthPat})\\.?\\s+(?:de\\s+)?(\\d{4})\\b`, "gi")
  for (const m of snippet.matchAll(re1)) {
    const month = MONTH_NAMES[m[2].toLowerCase()]
    const day = parseInt(m[1])
    const year = parseInt(m[3])
    if (month && day >= 1 && day <= 31 && year >= 2020) {
      const d = new Date(year, month - 1, day)
      if (d.getFullYear() === year) return d.toISOString().split("T")[0]
    }
  }

  // "May 24, 2026"
  const re2 = new RegExp(`\\b(${monthPat})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "gi")
  for (const m of snippet.matchAll(re2)) {
    const month = MONTH_NAMES[m[1].toLowerCase()]
    const day = parseInt(m[2])
    const year = parseInt(m[3])
    if (month && day >= 1 && day <= 31 && year >= 2020) {
      const d = new Date(year, month - 1, day)
      if (d.getFullYear() === year) return d.toISOString().split("T")[0]
    }
  }

  return null
}

function extractNextPaymentDate(text: string): string | null {
  // Look inside renewal-context sentences first
  const renewalRe = /(?:renov\w*|próximo\s+pago|next\s+payment|renews?\s+on|due\s+(?:on|date)|vencimiento|expir\w*)[^\n.]{0,100}/gi
  for (const m of text.matchAll(renewalRe)) {
    const snippet = m[0]
    const d = parseNamedMonthDate(snippet) ?? extractDate(snippet)
    if (d) return d
  }

  // Fall back: any named-month date anywhere in text
  return parseNamedMonthDate(text) ?? extractDate(text)
}

function extractBillingCycle(text: string): "monthly" | "yearly" | null {
  const lower = text.toLowerCase()
  if (/\b(mensual|monthly|cada\s+mes|per\s+month|\/mes|\/month)\b/.test(lower)) return "monthly"
  if (/\b(anual|yearly|annual|cada\s+a[ñn]o|per\s+year|\/a[ñn]o|\/year)\b/.test(lower)) return "yearly"
  return null
}

const SUB_SKIP = new Set([
  "pago", "factura", "suscripción", "suscripcion", "renovación",
  "renovacion", "billing", "invoice", "subscription", "payment", "fecha",
  "total", "estado", "acciones", "ver", "actualizar", "ajustar",
  "visa", "mastercard", "amex", "paypal", "paid", "activo", "active",
  "mensual", "anual", "monthly", "yearly", "annual",
])

// Generic plan prefixes that alone are NOT a service name
const PLAN_PREFIX_RE = /^(?:plan|planilla|tier|nivel|level|modelo)\s+/i

// Common plan qualifiers (not a brand name on their own)
const PLAN_QUALIFIERS = new Set([
  "pro", "premium", "plus", "basic", "free", "standard", "business",
  "enterprise", "starter", "essential", "individual", "team", "family",
  "personal", "developer", "growth", "scale",
])

/** Strips TLD suffix that OCR fuses into the brand name (e.g. "claudeai" → "Claude"). */
function cleanBrandFromOcr(raw: string): string {
  const stripped = raw.replace(/(?:ai|com|io|net|org|app|tv|me|co)$/i, "").replace(/-/g, " ").trim()
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase()
}

function extractSubscriptionName(text: string): { name: string | null; confidence: "high" | "low" } {
  // Priority 1a: exact domain with dot (e.g. "claude.ai", "netflix.com")
  const domainMatch = text.match(/\b([a-zA-Z][a-zA-Z0-9-]{1,30})\.(com|ai|io|net|org|app|co|tv|me)\b/i)
  if (domainMatch) {
    const brand = domainMatch[1]
    if (!SUB_SKIP.has(brand.toLowerCase())) {
      return { name: brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(), confidence: "high" }
    }
  }

  // Priority 1b: URL path like "claudeai/settings/billing" — OCR dropped the dot
  const urlPathMatch = text.match(/\b([a-zA-Z][a-zA-Z0-9]{3,25})\/(?:settings\/)?(?:billing|subscription|plan|account)/i)
  if (urlPathMatch) {
    const brand = cleanBrandFromOcr(urlPathMatch[1])
    if (brand.length > 1 && !SUB_SKIP.has(brand.toLowerCase())) {
      return { name: brand, confidence: "high" }
    }
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 60)
    .filter((l) => {
      const lower = l.toLowerCase()
      return (
        !SUB_SKIP.has(lower) &&
        !/^[\d\s.,/$€£%•·]+$/.test(l) &&
        !/^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}$/.test(l) &&
        !/^visa\s*[•*]+/i.test(l) &&
        !/^mastercard\s*[•*]+/i.test(l)
      )
    })
    .slice(0, 10)

  if (lines.length === 0) return { name: null, confidence: "low" }

  // Priority 2: short title-case line that is NOT a generic plan prefix
  const branded = lines.filter((l) => {
    if (!(/^[A-ZÁÉÍÓÚÜÑ]/.test(l))) return false
    if (PLAN_PREFIX_RE.test(l)) return false                    // skip "Plan Pro"
    const words = l.split(/\s+/)
    if (words.length === 1 && PLAN_QUALIFIERS.has(words[0].toLowerCase())) return false  // skip bare "Pro"
    return words.length <= 4
  })

  if (branded.length > 0) return { name: branded[0], confidence: "high" }

  // Priority 3: something starting with a plan prefix — extract qualifier, mark as low confidence
  const planLine = lines.find((l) => PLAN_PREFIX_RE.test(l))
  if (planLine) {
    const qualifier = planLine.replace(PLAN_PREFIX_RE, "").trim()
    return { name: qualifier || planLine, confidence: "low" }
  }

  // Fallback
  return { name: lines[0], confidence: "low" }
}

/** Extracts the subscription price from patterns like "S/.79.90/month" or "$9.99/mo". */
function extractSubscriptionAmount(text: string): number | null {
  // Price attached to a billing cycle unit: "$79.90/month", "S/.79.90/month", "9,99€/mes"
  const cyclePatterns = [
    /[$€£S\/R$]\.?\s*([\d.,]+)\s*\/(?:month|mes|year|año|mo|yr|an)/gi,
    /\(at\s+[$€£S\/R$]\.?\s*([\d.,]+)\s*\/(?:month|mes|year|año|mo|yr)\)/gi,
  ]

  for (const pattern of cyclePatterns) {
    for (const m of text.matchAll(pattern)) {
      const val = parseNumeric(m[1])
      if (val !== null && val > 0) return val
    }
  }

  return null
}

export function parseSubscriptionText(text: string): ParsedSubscription {
  // Prefer cycle-specific amount over generic largest-amount heuristic
  const amount = extractSubscriptionAmount(text) ?? extractAmount(text).amount
  const { name, confidence } = extractSubscriptionName(text)
  return {
    name,
    nameConfidence: confidence,
    amount,
    billingCycle: extractBillingCycle(text),
    nextPaymentDate: extractNextPaymentDate(text),
    rawText: text,
  }
}
