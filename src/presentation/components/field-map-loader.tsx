"use client"

import dynamic from "next/dynamic"
import type { ParcelaMapa } from "@/presentation/geo-queries"

const FieldMap = dynamic(
  () => import("./field-map").then((m) => m.FieldMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[72vh] animate-pulse rounded-lg border border-border bg-muted/40" />
    ),
  },
)

export function FieldMapLoader({ parcelas }: { parcelas: ParcelaMapa[] }) {
  return <FieldMap parcelas={parcelas} />
}
