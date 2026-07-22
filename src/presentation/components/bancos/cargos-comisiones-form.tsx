"use client"

import {
  CreditCard,
  DollarSign,
  History,
  Percent,
  Save,
  Tag,
  Wallet,
} from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { CargoComisionBancaria, CatGastoFinanciero, Cuenta } from "@/core/domain/entities"
import { formatDateShort, toDateInput } from "@/lib/dates"
import { crearCargoComisionBancariaAction } from "@/presentation/actions/bancos-actions"

interface CargosComisionesFormProps {
  cuentas: Cuenta[]
  catGastosFinancieros: CatGastoFinanciero[]
  cargosComisiones: CargoComisionBancaria[]
}

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n)

export function CargosComisionesBancariasView({
  cuentas,
  catGastosFinancieros,
  cargosComisiones,
}: CargosComisionesFormProps) {
  const [bancoCuentaId, setBancoCuentaId] = useState<string>("")
  const [catGastoFinancieroId, setCatGastoFinancieroId] = useState<string>("")
  const [fecha, setFecha] = useState<string>(toDateInput())
  const [monto, setMonto] = useState<string>("")
  const [folio, setFolio] = useState<string>("")
  const [observaciones, setObservaciones] = useState<string>("")

  const [isPending, startTransition] = useTransition()

  // Maps for readable names
  const cuentasMap = useMemo(() => {
    return Object.fromEntries(cuentas.map((c) => [c.id, c.nombre]))
  }, [cuentas])

  const conceptosMap = useMemo(() => {
    return Object.fromEntries(catGastosFinancieros.map((g) => [g.id, g.concepto]))
  }, [catGastosFinancieros])

  // Formatted date banner text matching screenshot ("HOY ES 21 DE JULIO DE 2026")
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

    if (!bancoCuentaId) {
      toast.error("Selecciona la Cuenta Bancaria a la que se aplicará el cargo.")
      return
    }
    if (!catGastoFinancieroId) {
      toast.error("Selecciona el Concepto Financiero.")
      return
    }
    const valMonto = Number(monto)
    if (!valMonto || valMonto <= 0) {
      toast.error("Ingresa un monto válido mayor a $0.00.")
      return
    }

    startTransition(async () => {
      const res = await crearCargoComisionBancariaAction({
        bancoCuentaId,
        catGastoFinancieroId,
        monto: valMonto,
        folio,
        fecha,
        observaciones,
      })

      if (res.ok) {
        toast.success("Cargo o comisión bancaria grabada exitosamente.")
        setMonto("")
        setFolio("")
        setObservaciones("")
      } else {
        toast.error(res.error ?? "No se pudo grabar el cargo o comisión.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Title Header Matching Screenshot */}
      <div className="flex flex-col items-center justify-center text-center gap-1.5 border-b border-border/80 pb-6">
        <div className="flex items-center gap-2">
          <Percent className="size-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">
            CARGOS Y COMISIONES BANCARIAS
          </h1>
        </div>
        <p className="text-xs md:text-sm font-semibold text-primary tracking-widest uppercase">
          {todayBanner}
        </p>
      </div>

      {/* Main Form Card Matching Screenshot */}
      <Card className="border-border/80 shadow-sm bg-card">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-sm font-bold text-primary flex items-center justify-between uppercase tracking-wide">
            <span className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              REGISTRO DE CARGO O COMISIÓN
            </span>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[11px] font-bold">
              Tipo: FINANCIEROS
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* FECHA */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-foreground">
                  FECHA:
                </label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-10 text-xs bg-background"
                  required
                />
              </div>

              {/* Tipo de Gastos */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-foreground">
                  Tipo de Gastos:
                </label>
                <div className="h-10 px-3 py-2 rounded-lg border border-input bg-muted/30 text-xs font-bold text-primary flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  <span>FINANCIEROS</span>
                </div>
              </div>

              {/* CUENTA BANCARIA */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase text-foreground">
                  CUENTA BANCARIA (CARGO A):
                </label>
                <Select value={bancoCuentaId} onValueChange={setBancoCuentaId}>
                  <SelectTrigger className="h-10 text-xs bg-background">
                    <SelectValue placeholder="-- Seleccionar Cuenta Bancaria --" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} {c.bancoNombre ? `(${c.bancoNombre})` : ""} — Saldo: {currency(c.saldoInicial)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CONCEPTO (Select showing CatGastoFinanciero options) */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase text-foreground">
                  CONCEPTO:
                </label>
                <Select value={catGastoFinancieroId} onValueChange={setCatGastoFinancieroId}>
                  <SelectTrigger className="h-10 text-xs bg-background">
                    <SelectValue placeholder="-- Seleccionar Concepto Financiero --" />
                  </SelectTrigger>
                  <SelectContent>
                    {catGastosFinancieros.map((g, idx) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.concepto}:{idx + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* MONTO */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-foreground">
                  MONTO: $
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="h-10 text-xs bg-background font-bold text-rose-600"
                  required
                />
              </div>

              {/* FOLIO */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-foreground">
                  FOLIO / REFERENCIA:
                </label>
                <Input
                  type="text"
                  placeholder="Ej. CARGO-BANK-001"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  className="h-10 text-xs bg-background"
                />
              </div>

              {/* OBSERVACIONES */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase text-foreground">
                  OBSERVACIONES:
                </label>
                <Input
                  type="text"
                  placeholder="Detalles adicionales del cargo o comisión..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="h-10 text-xs bg-background"
                />
              </div>
            </div>

            {/* Submit Button (GRABAR button from screenshot) */}
            <div className="flex justify-center border-t border-border/50 pt-5 mt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 px-10 h-11 text-xs font-black uppercase tracking-wider shadow-sm"
              >
                <Save className="size-4" />
                <span>{isPending ? "GRABANDO..." : "GRABAR"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Historial Table */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Historial de Cargos y Comisiones Grabadas
            </h2>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {cargosComisiones.length} registros
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-bold">Fecha</TableHead>
              <TableHead className="text-xs font-bold">Cuenta Bancaria</TableHead>
              <TableHead className="text-xs font-bold">Concepto Financiero</TableHead>
              <TableHead className="text-xs font-bold text-right">Monto ($)</TableHead>
              <TableHead className="text-xs font-bold">Folio</TableHead>
              <TableHead className="text-xs font-bold">Observaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargosComisiones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                  No hay cargos ni comisiones grabadas aún.
                </TableCell>
              </TableRow>
            ) : (
              cargosComisiones.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs font-medium">
                    {formatDateShort(c.fecha)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    {cuentasMap[c.bancoCuentaId] || c.bancoCuentaId}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-rose-600">
                    {conceptosMap[c.catGastoFinancieroId] || c.catGastoFinancieroId}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-rose-600 text-right tabular-nums">
                    -{currency(c.monto)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {c.folio || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.observaciones || "—"}
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
