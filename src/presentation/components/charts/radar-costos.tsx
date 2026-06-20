"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  manoObra: { label: "Mano de obra", color: "var(--chart-1)" },
  insumos: { label: "Insumos", color: "var(--chart-2)" },
} satisfies ChartConfig

export function RadarCostos({
  data,
}: {
  data: { rancho: string; manoObra: number; insumos: number }[]
}) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-72">
      <RadarChart data={data}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="rancho" />
        <Radar
          dataKey="manoObra"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.5}
        />
        <Radar
          dataKey="insumos"
          stroke="var(--chart-2)"
          fill="var(--chart-2)"
          fillOpacity={0.5}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </RadarChart>
    </ChartContainer>
  )
}
