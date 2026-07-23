"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Plus,
  RefreshCw,
  Repeat2,
  Wallet,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import type { Cuenta } from "@/core/domain/entities"
import { BankCard } from "@/presentation/components/bank-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toDateInput } from "@/lib/dates"
import { registrarTraspaso } from "@/app/dashboard/tesoreria/traspasos/actions"

export interface TraspasoFormClientProps {
  cuentas: Cuenta[]
  saldos: Record<string, number>
}

/**
 * Unified Money Transfer Flow Component.
 * Combines initial empty placeholders for Origen & Destino with interactive card selection
 * and real-time cashflow preview into a single cohesive interface.
 */
export function TraspasoFormClient({ cuentas, saldos }: TraspasoFormClientProps) {
  const router = useRouter()
  // Initially empty placeholders as requested by user
  const [origenId, setOrigenId] = useState<string>("")
  const [destinoId, setDestinoId] = useState<string>("")
  const [fecha, setFecha] = useState<string>(toDateInput())
  const [monto, setMonto] = useState<string>("")
  const [referencia, setReferencia] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Selection Modal State
  const [selectingSlot, setSelectingSlot] = useState<"origen" | "destino" | null>(null)
  const [referenciaModalSearch, setReferenciaModalSearch] = useState<string>("")

  const cuentaOrigen = cuentas.find((c) => c.id === origenId)
  const cuentaDestino = cuentas.find((c) => c.id === destinoId)

  const saldoOrigenActual = cuentaOrigen ? (saldos[cuentaOrigen.id] ?? cuentaOrigen.saldoInicial) : 0
  const saldoDestinoActual = cuentaDestino ? (saldos[cuentaDestino.id] ?? cuentaDestino.saldoInicial) : 0

  const montoNum = Number(monto) || 0
  const saldoOrigenFuturo = saldoOrigenActual - montoNum
  const saldoDestinoFuturo = saldoDestinoActual + montoNum

  // Overdraft confirmation dialog state
  const [showOverdraftConfirm, setShowOverdraftConfirm] = useState(false)

  const executeTraspaso = async () => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("fecha", fecha)
      formData.set("cuentaOrigenId", origenId)
      formData.set("cuentaDestinoId", destinoId)
      formData.set("monto", String(Number(monto)))
      formData.set("referencia", referencia)

      await registrarTraspaso(formData)
      toast.success("Traspaso entre cuentas registrado exitosamente")
      setMonto("")
      setReferencia("")
      setShowOverdraftConfirm(false)
      router.push("/dashboard/tesoreria")
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al registrar el traspaso")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origenId) {
      toast.error("Selecciona la cuenta de origen")
      return
    }
    if (!destinoId) {
      toast.error("Selecciona la cuenta de destino")
      return
    }
    if (origenId === destinoId) {
      toast.error("La cuenta origen y destino deben ser distintas")
      return
    }
    const montoNum = Number(monto)
    if (!montoNum || montoNum <= 0) {
      toast.error("Ingresa un monto válido mayor a $0")
      return
    }
    if (montoNum > saldoOrigenActual) {
      setShowOverdraftConfirm(true)
      return
    }

    await executeTraspaso()
  }

  const presetAmounts = [1000, 5000, 10000, 25000, 50000, 100000]

  // Filter valid choices for modal selector
  const availableAccountsForSlot =
    selectingSlot === "origen"
      ? cuentas.filter((c) => c.id !== destinoId)
      : cuentas.filter((c) => c.id !== origenId)

  const filteredAvailableAccounts = availableAccountsForSlot.filter((c) => {
    const q = referenciaModalSearch.toLowerCase().trim()
    if (!q) return true
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.bancoNombre ?? "").toLowerCase().includes(q) ||
      (c.titularNombre ?? "").toLowerCase().includes(q) ||
      (c.numeroCuenta ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* UNIFIED MONEY TRANSFER FLOW BANNER & CARD SLOTS */}
      <Card className="border-primary/20 bg-gradient-to-br from-background via-card to-background shadow-xs">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Repeat2 className="h-5 w-5 text-primary" />
              Flujo Monetario de Traspaso
            </CardTitle>
            {(origenId || destinoId) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setOrigenId("")
                  setDestinoId("")
                }}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reiniciar Selección
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-11 md:items-center">
            {/* SLOT 1: CUENTA ORIGEN */}
            <div className="md:col-span-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  1. Cuenta Origen (Retiro)
                </span>
                {cuentaOrigen && (
                  <button
                    type="button"
                    onClick={() => setSelectingSlot("origen")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              {cuentaOrigen ? (
                <div className="relative group">
                  <BankCard
                    cuenta={cuentaOrigen}
                    saldoCalculado={saldoOrigenActual}
                    readOnly
                  />
                  <div className="mt-2 flex items-center justify-between px-1 text-xs">
                    <span className="text-muted-foreground">Saldo Proyectado:</span>
                    <span
                      className={`font-bold ${
                        saldoOrigenFuturo < 0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {saldoOrigenFuturo.toLocaleString("es-MX", {
                        style: "currency",
                        currency: cuentaOrigen.moneda,
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                /* EMPTY PLACEHOLDER CARD FOR ORIGEN */
                <div
                  onClick={() => setSelectingSlot("origen")}
                  className="group flex h-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-500/30 bg-rose-500/5 p-6 text-center transition-all duration-300 hover:border-rose-500 hover:bg-rose-500/10 cursor-pointer shadow-xs"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-3 group-hover:scale-110 transition-transform">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <p className="font-extrabold text-sm text-foreground">
                    Seleccionar Cuenta Origen
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Haz clic aquí para elegir la cuenta de donde saldrá el dinero
                  </p>
                </div>
              )}
            </div>

            {/* FLOW DIRECTION ARROW & AMOUNT */}
            <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow-xs border border-primary/20">
                <ArrowRight className="h-6 w-6 rotate-90 md:rotate-0" />
              </div>
              <span className="text-[11px] font-bold text-center mt-2 text-primary">
                {montoNum > 0
                  ? montoNum.toLocaleString("es-MX", {
                      style: "currency",
                      currency: cuentaOrigen?.moneda ?? "MXN",
                    })
                  : "Traspaso"}
              </span>
            </div>

            {/* SLOT 2: CUENTA DESTINO */}
            <div className="md:col-span-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  2. Cuenta Destino (Depósito)
                </span>
                {cuentaDestino && (
                  <button
                    type="button"
                    onClick={() => setSelectingSlot("destino")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              {cuentaDestino ? (
                <div className="relative group">
                  <BankCard
                    cuenta={cuentaDestino}
                    saldoCalculado={saldoDestinoActual}
                    readOnly
                  />
                  <div className="mt-2 flex items-center justify-between px-1 text-xs">
                    <span className="text-muted-foreground">Saldo Proyectado:</span>
                    <span className="font-bold text-emerald-600">
                      {saldoDestinoFuturo.toLocaleString("es-MX", {
                        style: "currency",
                        currency: cuentaDestino.moneda,
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                /* EMPTY PLACEHOLDER CARD FOR DESTINO */
                <div
                  onClick={() => setSelectingSlot("destino")}
                  className="group flex h-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 p-6 text-center transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-500/10 cursor-pointer shadow-xs"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <p className="font-extrabold text-sm text-foreground">
                    Seleccionar Cuenta Destino
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Haz clic aquí para elegir la cuenta receptora del depósito
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OPERATING FORM DETAILS */}
      <Card className="max-w-2xl shadow-xs border-muted/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Zap className="h-5 w-5 text-amber-500" />
            Detalles de la Operación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha del Traspaso</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto">Monto a Transferir ($)</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Quick Amount Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Montos Rápidos:</span>
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setMonto(String(amt))}
                  >
                    ${amt.toLocaleString()}
                  </Button>
                ))}
                {cuentaOrigen && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => setMonto(String(Math.max(0, saldoOrigenActual)))}
                  >
                    Todo el Saldo
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Folio / Referencia / Concepto</Label>
              <Input
                id="referencia"
                placeholder="Ej. Transferencia para nómina de campo / SPEI-99201"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold shadow-xs"
              disabled={isSubmitting || !origenId || !destinoId}
            >
              {isSubmitting ? (
                "Procesando Traspaso..."
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Confirmar y Transferir Dinero
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ACCOUNT SELECTOR DIALOG MODAL */}
      <Dialog
        open={selectingSlot !== null}
        onOpenChange={(open) => !open && setSelectingSlot(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectingSlot === "origen" ? (
                <Wallet className="h-5 w-5 text-rose-500" />
              ) : (
                <Building2 className="h-5 w-5 text-emerald-600" />
              )}
              Seleccionar {selectingSlot === "origen" ? "Cuenta Origen" : "Cuenta Destino"}
            </DialogTitle>
            <DialogDescription>
              Selecciona de la lista la cuenta bancaria para esta operación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* Search filter for modal */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar por banco, titular o cuenta..."
                value={referenciaModalSearch}
                onChange={(e) => setReferenciaModalSearch(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {/* Compact Accounts List */}
            <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden max-h-[50vh] overflow-y-auto">
              {filteredAvailableAccounts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No se encontraron cuentas disponibles.
                </div>
              ) : (
                filteredAvailableAccounts.map((c) => {
                  const saldoActual = saldos[c.id] ?? c.saldoInicial
                  const isSelected =
                    selectingSlot === "origen" ? origenId === c.id : destinoId === c.id
                  return (
                    <button
                      key={`modal-${c.id}`}
                      type="button"
                      onClick={() => {
                        if (selectingSlot === "origen") {
                          setOrigenId(c.id)
                        } else {
                          setDestinoId(c.id)
                        }
                        setSelectingSlot(null)
                        setReferenciaModalSearch("")
                      }}
                      className={`w-full flex items-center justify-between p-3 text-left transition hover:bg-muted/60 group ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 group-hover:border-primary/40 group-hover:bg-primary/10 transition-colors">
                          <Wallet className="size-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                              {c.nombre}
                            </span>
                            <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                              {c.bancoNombre || c.tipo}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            {c.titularNombre && <span>{c.titularNombre}</span>}
                            {c.numeroCuenta && <span className="font-mono">&middot; {c.numeroCuenta}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-foreground block">
                          {saldoActual.toLocaleString("es-MX", {
                            style: "currency",
                            currency: c.moneda,
                          })}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
                          Disponible
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OVERDRAFT CONFIRMATION DIALOG */}
      <AlertDialog open={showOverdraftConfirm} onOpenChange={setShowOverdraftConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar transferencia con sobregiro?</AlertDialogTitle>
            <AlertDialogDescription>
              El monto a transferir (${Number(monto).toLocaleString("es-MX")}) supera el saldo disponible de la cuenta origen (${saldoOrigenActual.toLocaleString("es-MX")}). ¿Deseas continuar con la operación de todos modos?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeTraspaso}
              disabled={isSubmitting}
              className="bg-amber-600 text-white hover:bg-amber-500 font-bold"
            >
              {isSubmitting ? "Procesando..." : "Sí, Transferir de todos modos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
