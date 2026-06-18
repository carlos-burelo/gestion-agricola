"use client"

import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  delta,
  spark,
  icon,
  href,
}: {
  label: string
  value: string
  delta?: number
  spark?: number[]
  icon?: ReactNode
  href?: string
}) {
  const up = (delta ?? 0) >= 0
  const sparkId = label.replace(/\s+/g, "-").toLowerCase()
  const body = (
    <Card className="h-full transition-colors hover:border-primary">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
          {typeof delta === "number" && (
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-0.5 text-xs font-medium",
                up ? "text-primary" : "text-destructive",
              )}
            >
              {up ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
        {spark && spark.length > 1 && (
          <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark.map((v, i) => ({ i, v }))}>
                <defs>
                  <linearGradient id={`sp-${sparkId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill={`url(#sp-${sparkId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{body}</Link> : body
}
