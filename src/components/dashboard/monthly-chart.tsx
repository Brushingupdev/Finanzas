"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface MonthlyChartProps {
  data: { month: string; income: number; expenses: number }[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <Card className="border shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">
          Tendencia mensual
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#d4d4d8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "10px",
                  fontSize: 13,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  padding: "10px 14px",
                }}
                cursor={{ fill: "#fafafa" }}
              />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="income" fill="#18181b" radius={[5, 5, 0, 0]} name="Ingresos" maxBarSize={30} />
              <Bar dataKey="expenses" fill="#d4d4d8" radius={[5, 5, 0, 0]} name="Gastos" maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}