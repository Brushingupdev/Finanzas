"use server"

import OpenAI from "openai"

function buildPrompt(categories: { id: string; name: string }[]): string {
  const categoryList = categories.length > 0
    ? `\nCategories (pick best matching id, or null if none fit):\n${categories.map((c) => `${c.id}: ${c.name}`).join("\n")}`
    : ""

  return `Analyze this image and classify it as one of: receipt (one-time expense), subscription (recurring billing), or income (money received).

Return ONLY a valid JSON object — no markdown, no explanation, no extra text.

If it's a receipt or one-time expense (supermarket, restaurant, pharmacy, store purchase):
{
  "type": "receipt",
  "amount": <number or null>,
  "currency": "<USD|EUR|PEN|ARS|MXN|COP|CLP|BRL|etc or null>",
  "date": "<ISO date like 2026-05-23, or null>",
  "description": "<merchant or store name, short, or null>",
  "categoryId": "<id from the list below, or null>"
}

If it's an income document (invoice you sent, payment received, deposit slip, salary):
{
  "type": "income",
  "amount": <number or null>,
  "currency": "<USD|EUR|PEN|ARS|MXN|COP|CLP|BRL|etc or null>",
  "date": "<ISO date like 2026-05-23, or null>",
  "description": "<payer or income source, short, or null>",
  "categoryId": "<id from the list below, or null>"
}

If it's a subscription or recurring billing page (ANY service with a plan, pricing tier, or recurring charge — SaaS, AI tools, streaming, cloud, developer tools, apps):
{
  "type": "subscription",
  "name": "<service or product name. Examples: Netflix, Spotify, Claude, ChatGPT Plus, GitHub Copilot, OpenCode Go, AWS, Vercel, Notion, Linear. Extract the main brand/product name, not the plan tier>",
  "amount": <regular recurring price as number. If you see a discounted price AND a regular price, use the regular one. If only one price is visible, use that. NOT the free tier price>,
  "currency": "<USD|EUR|PEN|ARS|MXN|COP|CLP|BRL|etc or null>",
  "billingCycle": "<monthly or yearly or null>",
  "nextPaymentDate": "<ISO date like 2026-05-23, or null>",
  "categoryId": "<id from the list below, or null>"
}

DETECTION GUIDE:
- If the page shows a plan name, pricing tier, "current plan", billing cycle (monthly/yearly), "next payment", or "renews on" → it's a SUBSCRIPTION
- If it looks like a supermarket/grocery/store receipt with multiple items → it's a RECEIPT
- If it's an invoice YOU issued or a deposit/payment confirmation TO you → it's INCOME
- Developer tools, SaaS platforms, API services with a paid plan are SUBSCRIPTIONS — even if they have a free tier

CURRENCY DETECTION — CRITICAL. Follow these rules strictly:

SAAS / DEVELOPER TOOLS / ENGLISH PAGES (OpenCode Go, GitHub Copilot, ChatGPT Plus, Claude, Vercel, AWS, Linear, Notion, etc.):
- **CRITICAL: "$" on ANY English-language SaaS, developer tool, or subscription billing page is ALWAYS USD. Never return PEN, ARS, MXN or any Latin American currency for these.**
- These services bill in USD globally. The "$" symbol means United States Dollars.
- If the entire page is in English and shows SaaS pricing → currency is "USD", always.

SPANISH / LATAM CONTEXT:
- Only infer a Latin American currency if the page content is in SPANISH (or Portuguese) AND shows local context (store name in Spanish, local address, ".pe" / ".ar" / ".mx" domain visible).
- "S/." prefix → PEN (Peruvian soles)
- "R$" prefix → BRL (Brazilian reais)
- "€" → EUR

OTHER SYMBOLS:
- "US$", "USD", "$XX.XX USD" written explicitly → USD
- If you see a currency code like "USD", "EUR", "PEN" written as text, use that

Return null only if absolutely no currency symbol or indicator is visible.

RULES:
- For subscriptions: ALWAYS prefer the regular recurring price. If you see "$10/month" and a discounted "$5/month", return 10
- Dates must use ISO format like 2026-05-23 (4-digit year, 2-digit month, 2-digit day)
- Use null for any field you can't determine with confidence
- For categoryId: pick the best matching id from the categories list. If nothing fits, use null
${categoryList}`
}

export interface ScanResult {
  type: "receipt" | "subscription" | "income"
  amount: number | null
  currency: string | null
  date: string | null
  description: string | null
  name: string | null
  billingCycle: "monthly" | "yearly" | null
  nextPaymentDate: string | null
  categoryId: string | null
}

export async function scanImage(
  base64: string,
  mimeType: string,
  categories: { id: string; name: string }[] = []
): Promise<ScanResult> {
  const apiKey = process.env.ZAI_API_KEY
  if (!apiKey) throw new Error("ZAI_API_KEY no está configurado")

  const model = process.env.AI_VISION_MODEL ?? "glm-4.6v-flash"
  const baseURL = process.env.AI_VISION_BASE_URL ?? "https://api.z.ai/api/paas/v4/"

  const client = new OpenAI({
    apiKey,
    baseURL,
  })

  let response
  try {
    response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: "text", text: buildPrompt(categories) },
          ],
        },
      ],
      max_tokens: 1024,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
      throw new Error("Límite de uso alcanzado. Esperá unos segundos y volvé a intentarlo.")
    }
    if (msg.includes("404") || msg.includes("not found") || msg.includes("does not exist")) {
      throw new Error("Modelo no disponible. Verificá los permisos de tu API key en Z.AI.")
    }
    throw new Error(`Error al analizar la imagen: ${msg}`)
  }

  const raw = response.choices[0]?.message?.content?.trim() ?? ""

  // Try to extract JSON from the response — the model may wrap it in markdown or add text
  const jsonText = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim()

  // If the above didn't produce valid JSON, try to find a JSON object in the text
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    // Try to extract just the JSON object from surrounding text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        parsed = fallbackParse(jsonText)
      }
    } else {
      parsed = fallbackParse(jsonText)
    }
  }

  // Coerce types — LLMs often return numbers as strings
  const amount = coerceNumber(parsed.amount)

  // Normalize type
  const rawType = String(parsed.type ?? "").toLowerCase()
  const type = rawType === "subscription" ? "subscription"
    : rawType === "income" ? "income"
    : "receipt"

  // Validate that returned categoryId actually exists in our list
  const validIds = new Set(categories.map((c) => c.id))
  const categoryId = typeof parsed.categoryId === "string" && validIds.has(parsed.categoryId)
    ? parsed.categoryId
    : null

  const validCurrencies = new Set(["USD", "EUR", "PEN", "ARS", "MXN", "COP", "CLP", "BRL"])
  let detectedCurrency = typeof parsed.currency === "string" && validCurrencies.has(parsed.currency.toUpperCase())
    ? parsed.currency.toUpperCase()
    : null

  const parsedName = typeof parsed.name === "string" && parsed.name ? parsed.name : null

  // Safety net: known international SaaS/dev tools that always bill in USD.
  // If the AI didn't detect currency or misidentified it as a local currency,
  // force USD so the conversion runs correctly.
  const usdServices = new Set([
    "opencode", "opencode go", "github copilot", "copilot",
    "chatgpt", "chatgpt plus", "openai", "claude", "anthropic",
    "vercel", "aws", "linear", "notion", "cursor", "v0",
    "bolt", "replit", "midjourney", "perplexity", "gemini",
    "google ai", "windsurf", "devin", "lovable", "superbase",
  ])
  if (type === "subscription" && parsedName && usdServices.has(parsedName.toLowerCase().trim())) {
    detectedCurrency = "USD"
  }

  return {
    type,
    amount,
    currency: detectedCurrency,
    date: typeof parsed.date === "string" && parsed.date ? parsed.date : null,
    description: typeof parsed.description === "string" && parsed.description ? parsed.description : null,
    name: parsedName,
    billingCycle: parsed.billingCycle === "monthly" || parsed.billingCycle === "yearly" ? parsed.billingCycle : null,
    nextPaymentDate: typeof parsed.nextPaymentDate === "string" && parsed.nextPaymentDate ? parsed.nextPaymentDate : null,
    categoryId,
  }
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && !isNaN(value)) return value
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[^0-9.\-]/g, ""))
    return isNaN(n) ? null : n
  }
  return null
}

function fallbackParse(text: string): Record<string, unknown> {
  const amount = text.match(/"amount"\s*:\s*([0-9.]+)/)?.[1]
  const type = text.includes('"subscription"') ? "subscription" : text.includes('"income"') ? "income" : "receipt"
  const description = text.match(/"description"\s*:\s*"([^"]+)"/)?.[1]
  const date = text.match(/"date"\s*:\s*"([^"]+)"/)?.[1]
  const name = text.match(/"name"\s*:\s*"([^"]+)"/)?.[1]
  const currency = text.match(/"currency"\s*:\s*"([^"]+)"/)?.[1]
  const billingCycle = text.match(/"billingCycle"\s*:\s*"(monthly|yearly)"/)?.[1]
  const nextPaymentDate = text.match(/"nextPaymentDate"\s*:\s*"([^"]+)"/)?.[1]
  const categoryId = text.match(/"categoryId"\s*:\s*"([^"]+)"/)?.[1]
  return {
    type,
    amount: amount ? parseFloat(amount) : null,
    currency: currency ?? null,
    description: description ?? null,
    date: date ?? null,
    name: name ?? null,
    billingCycle: billingCycle ?? null,
    nextPaymentDate: nextPaymentDate ?? null,
    categoryId: categoryId ?? null,
  }
}
