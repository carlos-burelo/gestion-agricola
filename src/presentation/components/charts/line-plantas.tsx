"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { PuntoSiembra } from "@/core/application/analytics-service"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  plantas: { label: "Plantas", color: "var(--chart-1)" },
} satisfies ChartConfig

export function LinePlantas({ data }: { data: PuntoSiembra[] }) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={56} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="plantas"
          type="monotone"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
