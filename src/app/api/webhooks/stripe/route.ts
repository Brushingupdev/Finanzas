import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const eq = part.indexOf("=")
      return [part.slice(0, eq), part.slice(eq + 1)]
    })
  )

  const timestamp = parts["t"]
  const expectedSig = parts["v1"]
  if (!timestamp || !expectedSig) return false

  const computed = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")

  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(expectedSig))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature") ?? ""

  if (!verifyStripeSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(body) as { type: string; data: unknown }

  switch (event.type) {
    case "checkout.session.completed":
      break
    case "invoice.payment_failed":
      break
    default:
      break
  }

  return NextResponse.json({ received: true })
}
