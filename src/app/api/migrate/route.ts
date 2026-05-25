import { NextResponse } from "next/server"
import { createClient } from "@libsql/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const url = process.env.DATABASE_URL
    if (!url) {
      return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 })
    }

    const client = createClient({ url })

    // These are the exact SQL commands needed to align Turso with the Prisma schema
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS "new_transactions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "category_id" TEXT,
        "account_id" TEXT,
        "amount" REAL NOT NULL,
        "type" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "transaction_date" DATETIME NOT NULL,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );`,
      `INSERT INTO "new_transactions" ("amount", "category_id", "created_at", "description", "id", "transaction_date", "type", "user_id") 
       SELECT "amount", "category_id", "created_at", "description", "id", "transaction_date", "type", "user_id" FROM "transactions";`,
      `DROP TABLE "transactions";`,
      `ALTER TABLE "new_transactions" RENAME TO "transactions";`,
      
      `CREATE TABLE IF NOT EXISTS "new_budgets" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "category_id" TEXT NOT NULL,
        "month" INTEGER NOT NULL,
        "year" INTEGER NOT NULL,
        "planned_amount" REAL NOT NULL,
        CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `INSERT INTO "new_budgets" ("category_id", "id", "month", "planned_amount", "user_id", "year") 
       SELECT "category_id", "id", "month", "planned_amount", "user_id", "year" FROM "budgets";`,
      `DROP TABLE "budgets";`,
      `ALTER TABLE "new_budgets" RENAME TO "budgets";`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "budgets_user_id_category_id_month_year_key" ON "budgets"("user_id", "category_id", "month", "year");`
    ]

    for (const sql of sqlCommands) {
      await client.execute(sql)
    }

    return NextResponse.json({ success: true, message: "Migrations applied successfully." })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ 
      error: "Migration failed", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
