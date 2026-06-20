"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { ResumenCosto } from "@/core/application/costing-service"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  manoObra: { label: "Mano de obra", color: "var(--chart-1)" },
  insumos: { label: "Insumos", color: "var(--chart-2)" },
} satisfies ChartConfig

export function BarCosteoNivel({
  rows,
  labels,
}: {
  rows: ResumenCosto[]
  labels: Record<string, string>
}) {
  if (rows.length === 0) return <EmptyState />
  const data = rows.slice(0, 8).map((r) => ({
    nombre: labels[r.clave] ?? r.clave,
    manoObra: r.manoObra,
    insumos: r.insumos,
  }))
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="nombre" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="manoObra" stackId="a" fill="var(--chart-1)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="insumos" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
