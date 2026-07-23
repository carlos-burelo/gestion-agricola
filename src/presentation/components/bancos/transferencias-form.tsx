"use client"

import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  History,
  Send,
  UserCheck,
  Wallet,
} from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Cuenta, Traspaso, TransferenciaHijuelos } from "@/core/domain/entities"
import { formatDateShort, toDateInput } from "@/lib/dates"
import { crearTransferenciaBancariaAction } from "@/presentation/actions/bancos-actions"

interface TransferenciasFormProps {
  cuentas: Cuenta[]
  traspasos: Traspaso[]
  transferenciasHijuelos: TransferenciaHijuelos[]
}

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n)

export function TransferenciasBancariasView({
  cuentas,
  traspasos,
  transferenciasHijuelos,
}: TransferenciasFormProps) {
  const [cuentaOrigenId, setCuentaOrigenId] = useState<string>("")
  const [cuentaDestinoId, setCuentaDestinoId] = useState<string>("")
  const [esCompraHijuelos, setEsCompraHijuelos] = useState<boolean>(false)
  const [fecha, setFecha] = useState<string>(toDateInput())
  const [monto, setMonto] = useState<string>("")
  const [metodoPago, setMetodoPago] = useState<string>("Transferencia SPEI")
  const [folio, setFolio] = useState<string>("")
  const [observaciones, setObservaciones] = useState<string>("")

  const [isPending, startTransition] = useTransition()

  // Selected account details
  const cuentaOrigen = useMemo(
    () => cuentas.find((c) => c.id === cuentaOrigenId),
    [cuentas, cuentaOrigenId]
  )
  const cuentaDestino = useMemo(
    () => cuentas.find((c) => c.id === cuentaDestinoId),
    [cuentas, cuentaDestinoId]
  )

  // Map of account ID to name
  const cuentasMap = useMemo(() => {
    return Object.fromEntries(cuentas.map((c) => [c.id, c.nombre]))
  }, [cuentas])

  // Formatted date banner text matching Image 2 ("HOY ES 21 DE JULIO DE 2026")
  const todayBanner = useMemo(() => {
    const d = new Date()
    const months = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ]
    return `HOY ES ${d.getDate()} DE ${months[d.getMonth()]} DE ${d.getFullYear()}`
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!cuentaOrigenId || !cuentaDestinoId) {
      toast.error("Selecciona la Cuenta Origen y la Cuenta Destino.")
      return
    }
    if (cuentaOrigenId === cuentaDestinoId) {
      toast.error("La Cuenta Origen y la Cuenta Destino no pueden ser la misma.")
      return
    }
    const valMonto = Number(monto)
    if (!valMonto || valMonto <= 0) {
      toast.error("Ingresa un importe válido mayor a $0.00.")
      return
    }

    startTransition(async () => {
      const res = await crearTransferenciaBancariaAction({
        cuentaOrigenId,
        cuentaDestinoId,
        esCompraHijuelos,
        fecha,
        monto: valMonto,
        metodoPago,
        folio,
        observaciones,
      })

      if (res.ok) {
        toast.success("Transferencia bancaria registrada exitosamente.")
        setMonto("")
        setFolio("")
        setObservaciones("")
      } else {
        toast.error(res.error ?? "No se pudo registrar la transferencia.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner Exact Matching Image 2 */}
      <div className="flex flex-col items-center justify-center text-center gap-1.5 border-b border-border/80 pb-6">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="size-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">
            TRANSFERENCIAS BANCARIAS
          </h1>
        </div>
        <p className="text-xs md:text-sm font-semibold text-primary tracking-widest uppercase">
          {todayBanner}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Two Accounts Cards Side-by-Side (Matching Image 2 Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: CUENTA ORIGEN */}
          <Card className="border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                <Wallet className="size-4 text-primary" />
                CUENTA ORIGEN
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>No. Cta:</span>
                  {cuentaOrigen && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ID: {cuentaOrigen.id}
                    </span>
                  )}
                </label>
                <Select value={cuentaOrigenId} onValueChange={setCuentaOrigenId}>
                  <SelectTrigger className="w-full h-10 text-xs bg-background">
                    <SelectValue placeholder="-- Seleccionar Cuenta Origen --" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} ({currency(c.saldoInicial)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Account Details Box */}
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Banco emisor:</span>
                  <span className="font-semibold text-foreground">
                    {cuentaOrigen?.bancoNombre || cuentaOrigen?.nombre || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Titular / Beneficiario:</span>
                  <span className="font-semibold text-foreground">
                    {cuentaOrigen?.titularNombre || cuentaOrigen?.nombre || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Número / CLABE:</span>
                  <span className="font-mono text-muted-foreground">
                    {cuentaOrigen?.numeroCuenta || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/40 pt-2 mt-1">
                  <span className="text-muted-foreground font-medium">Saldo registrado:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {cuentaOrigen ? currency(cuentaOrigen.saldoInicial) : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: CUENTA DESTINO */}
          <Card className="border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                <Building2 className="size-4 text-primary" />
                CUENTA DESTINO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>No. Cta:</span>
                  {cuentaDestino && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ID: {cuentaDestino.id}
                    </span>
                  )}
                </label>
                <Select value={cuentaDestinoId} onValueChange={setCuentaDestinoId}>
                  <SelectTrigger className="w-full h-10 text-xs bg-background">
                    <SelectValue placeholder="-- Seleccionar Cuenta Destino --" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} ({currency(c.saldoInicial)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Account Details Box */}
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Banco receptor:</span>
                  <span className="font-semibold text-foreground">
                    {cuentaDestino?.bancoNombre || cuentaDestino?.nombre || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Titular / Beneficiario:</span>
                  <span className="font-semibold text-foreground">
                    {cuentaDestino?.titularNombre || cuentaDestino?.nombre || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Número / CLABE:</span>
                  <span className="font-mono text-muted-foreground">
                    {cuentaDestino?.numeroCuenta || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/40 pt-2 mt-1">
                  <span className="text-muted-foreground font-medium">Saldo registrado:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {cuentaDestino ? currency(cuentaDestino.saldoInicial) : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Form Controls Card (Matching Image 2 Controls) */}
        <Card className="border-border/80 shadow-xs bg-card">
          <CardContent className="pt-6 flex flex-col gap-5">
            {/* Special Checkbox: Compra de Hijuelos */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 w-fit">
              <Checkbox
                id="compraHijuelos"
                checked={esCompraHijuelos}
                onCheckedChange={(c) => setEsCompraHijuelos(Boolean(c))}
              />
              <label
                htmlFor="compraHijuelos"
                className="text-xs font-bold text-amber-900 dark:text-amber-300 cursor-pointer select-none"
              >
                Compra de Hijuelos (Concepto Fiscal Especial)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Fecha de la Operación */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Fecha de la Operación:
                </label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-9 text-xs bg-background"
                  required
                />
              </div>

              {/* Importe: $ */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Importe: $
                </label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="h-9 text-xs bg-background font-semibold"
                  required
                />
              </div>

              {/* Método de Pago */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Método de Pago:
                </label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transferencia SPEI">Transferencia SPEI</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Depósito Bancario">Depósito Bancario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Folio o Num. Cheque */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Folio o Num. Cheque:
                </label>
                <Input
                  id="folio"
                  name="folio"
                  type="text"
                  placeholder="Ej. SPEI-880192 / CHQ-001"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              {/* Observación */}
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Observación:
                </label>
                <Input
                  id="observaciones"
                  name="observaciones"
                  type="text"
                  placeholder="Comentarios u observaciones del movimiento..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end border-t border-border/50 pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 px-8 h-10 font-bold shadow-xs text-xs"
              >
                <Send className="size-4" />
                <span>{isPending ? "Guardando..." : "Guardar Transferencia"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Historial de Transferencias Bancarias */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Historial de Transferencias y Traspasos
            </h2>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {traspasos.length} registros
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-bold">Fecha</TableHead>
              <TableHead className="text-xs font-bold">Cuenta Origen</TableHead>
              <TableHead className="text-xs font-bold">Cuenta Destino</TableHead>
              <TableHead className="text-xs font-bold text-right">Importe ($)</TableHead>
              <TableHead className="text-xs font-bold">Referencia / Folio</TableHead>
              <TableHead className="text-xs font-bold">Registrado Por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {traspasos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                  No hay transferencias registradas aún.
                </TableCell>
              </TableRow>
            ) : (
              traspasos.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs font-medium">
                    {formatDateShort(t.fecha)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    {cuentasMap[t.cuentaOrigenId] || t.cuentaOrigenId}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    {cuentasMap[t.cuentaDestinoId] || t.cuentaDestinoId}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-emerald-600 text-right tabular-nums">
                    {currency(t.monto)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.referencia || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.creadoPor || "Sistema"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
