"use client"

import { MapPin } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { ParcelaMapa } from "@/presentation/geo-queries"
import { StatusBadge } from "./status-badge"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function ParcelaDetailPanel({
  parcela,
  onClose,
}: {
  parcela: ParcelaMapa | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!parcela} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            Parcela {parcela?.identificador}
          </SheetTitle>
          <SheetDescription>{parcela?.ranchoNombre}</SheetDescription>
        </SheetHeader>
        {parcela && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex items-center gap-2">
              <StatusBadge estado={parcela.estado} />
              <span className="text-sm tabular-nums text-muted-foreground">
                {parcela.superficieM2.toLocaleString("es-MX")} m²
              </span>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Costo acumulado</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {currency(parcela.costoTotal)}
              </p>
            </div>
            {!parcela.geometria && (
              <p className="text-sm text-muted-foreground">
                Esta parcela aún no tiene límites dibujados.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
