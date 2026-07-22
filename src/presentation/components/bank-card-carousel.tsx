"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CreditCard, Layers } from "lucide-react"
import type { Cuenta } from "@/core/domain/entities"
import { BankCard } from "@/presentation/components/bank-card"
import { Button } from "@/components/ui/button"

export interface BankCardCarouselProps {
  cuentas: Cuenta[]
  saldos: Record<string, number>
  readOnly?: boolean
  onSelectCard?: (cuenta: Cuenta) => void
  selectedCuentaId?: string
  className?: string
}

/**
 * Interactive FinTech Wallet Carousel: Shows ONLY 1 active card at a time on screen,
 * with previous/next controls, dot indicators, and quick account selector pills.
 */
export function BankCardCarousel({
  cuentas,
  saldos,
  readOnly = false,
  onSelectCard,
  selectedCuentaId,
  className = "",
}: BankCardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (selectedCuentaId) {
      const idx = cuentas.findIndex((c) => c.id === selectedCuentaId)
      return idx >= 0 ? idx : 0
    }
    return 0
  })

  if (!cuentas || cuentas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay cuentas disponibles
      </div>
    )
  }

  const currentCuenta = cuentas[activeIndex] ?? cuentas[0]

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % cuentas.length
    setActiveIndex(nextIdx)
    onSelectCard?.(cuentas[nextIdx])
  }

  const handlePrev = () => {
    const prevIdx = (activeIndex - 1 + cuentas.length) % cuentas.length
    setActiveIndex(prevIdx)
    onSelectCard?.(cuentas[prevIdx])
  }

  const handleSelectIndex = (index: number) => {
    setActiveIndex(index)
    onSelectCard?.(cuentas[index])
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* 1. Card Container (Focused single card) */}
      <div className="w-full max-w-md relative transition-all duration-300">
        <BankCard
          cuenta={currentCuenta}
          saldoCalculado={saldos[currentCuenta.id]}
          readOnly={readOnly}
          href={readOnly ? `/dashboard/tesoreria/${currentCuenta.id}` : undefined}
        />
      </div>

      {/* 2. Carousel Controls: Arrows + Dots */}
      {cuentas.length > 1 && (
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          <div className="flex items-center justify-between w-full px-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={handlePrev}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              Anterior
            </Button>

            {/* Pagination dots */}
            <div className="flex items-center gap-1.5">
              {cuentas.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.nombre}
                  onClick={() => handleSelectIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={handleNext}
            >
              Siguiente
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Quick Pill Selector for Cuentas */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {cuentas.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectIndex(idx)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  idx === activeIndex
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {c.nombre.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
