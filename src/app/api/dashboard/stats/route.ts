import { NextResponse } from "next/server"
import { getDashboardStats } from "@/features/reports/reports"
import { AuthError } from "@/lib/errors"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getDashboardStats()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    console.error("dashboard stats error", error)
    return NextResponse.json({ error: "No se pudo cargar el panel" }, { status: 500 })
  }
}

