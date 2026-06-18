"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { MezclaCosto } from "@/core/application/analytics-service"
import { EmptyState } from "@/presentation/components/empty-state"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"]
const config = {
  valor: { label: "Costo" },
} satisfies ChartConfig

export function DonutMezcla({ data }: { data: MezclaCosto[] }) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-64">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={data}
          dataKey="valor"
          nameKey="categoria"
          innerRadius={60}
          strokeWidth={4}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="categoria" />} />
      </PieChart>
    </ChartContainer>
  )
}
