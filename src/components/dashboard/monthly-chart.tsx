"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface MonthlyChartProps {
  data: { month: string; income: number; expenses: number }[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Tendencia mensual
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
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
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Bar dataKey="income" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Ingresos" maxBarSize={30} />
              <Bar dataKey="expenses" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} name="Gastos" maxBarSize={30} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}