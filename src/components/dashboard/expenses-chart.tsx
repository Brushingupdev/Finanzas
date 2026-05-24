"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

// Desaturate category colors for a more muted, premium look
function desaturateColor(hex: string): string {
  // Simple approach: blend with neutral gray
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (val: number) => Math.round(val * 0.7 + 128 * 0.3)
  const toHex = (n: number) => n.toString(16).padStart(2, "0")
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}

interface ExpensesChartProps {
  data: { name: string; amount: number; color: string }[]
}

export function ExpensesChart({ data }: ExpensesChartProps) {
  const mutedData = data.map((d) => ({ ...d, color: desaturateColor(d.color) }))

  if (mutedData.length === 0) {
    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Gastos por categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex h-[280px] flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="h-16 w-16 rounded-full border-2 border-dashed border-border" />
            <p className="text-sm">Sin datos de gastos este mes</p>
            <p className="text-xs text-muted-foreground">Registra transacciones para ver el desglose</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Gastos por categoría
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={mutedData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="amount" nameKey="name" strokeWidth={0}>
                {mutedData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                  color: "var(--foreground)",
                }}
                itemStyle={{ color: "var(--foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {mutedData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-medium text-foreground">${d.amount.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
  }