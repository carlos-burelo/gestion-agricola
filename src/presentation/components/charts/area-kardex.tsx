"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  saldoImporte: { label: "Saldo valor", color: "var(--chart-1)" },
} satisfies ChartConfig

export function AreaKardex({
  rows,
}: {
  rows: { fecha: string; saldoImporte: number }[]
}) {
  if (rows.length === 0)
    return <EmptyState message="Selecciona un producto con movimientos." />
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <AreaChart data={rows} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={64} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillKardex" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          dataKey="saldoImporte"
          type="monotone"
          stroke="var(--chart-1)"
          fill="url(#fillKardex)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
