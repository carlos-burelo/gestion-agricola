"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { PuntoMensual } from "@/core/application/analytics-service"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  manoObra: { label: "Mano de obra", color: "var(--chart-1)" },
  insumos: { label: "Insumos", color: "var(--chart-2)" },
} satisfies ChartConfig

export function AreaCostos({ data }: { data: PuntoMensual[] }) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillMo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          dataKey="manoObra"
          type="monotone"
          stackId="a"
          stroke="var(--chart-1)"
          fill="url(#fillMo)"
        />
        <Area
          dataKey="insumos"
          type="monotone"
          stackId="a"
          stroke="var(--chart-2)"
          fill="url(#fillIn)"
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
