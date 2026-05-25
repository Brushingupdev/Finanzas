import { NextResponse } from "next/server"
import { getDashboardStats } from "@/features/reports/reports"
import { AuthError } from "@/lib/errors"
import { Prisma } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getDashboardStats()
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Common after deploying code that expects a newer schema than the current DB.
      if (error.code === "P2021" || error.code === "P2022") {
        console.error("dashboard stats schema mismatch", {
          code: error.code,
          meta: error.meta,
          message: error.message,
        })
        return NextResponse.json(
          { error: "La base de datos está desactualizada. Ejecuta las migraciones pendientes." },
          { status: 503 }
        )
      }
    }

    console.error("dashboard stats error", {
      message: error instanceof Error ? error.message : "unknown",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "No se pudo cargar el panel" }, { status: 500 })
  }
}
