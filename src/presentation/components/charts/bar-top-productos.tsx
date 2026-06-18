"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  valor: { label: "Valor", color: "var(--chart-1)" },
} satisfies ChartConfig

export function BarTopProductos({
  data,
}: {
  data: { nombre: string; valor: number }[]
}) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="nombre"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="valor" fill="var(--chart-1)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
