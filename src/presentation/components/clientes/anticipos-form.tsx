"use client"

import {
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  History,
  Info,
  Receipt,
  Save,
  User,
  UserCheck,
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
import type { AnticipoCliente, Cliente, Cuenta } from "@/core/domain/entities"
import { formatDateShort, toDateInput } from "@/lib/dates"
import { crearAnticipoClienteAction } from "@/presentation/actions/clientes-actions"

interface AnticiposClientesFormProps {
  clientes: Cliente[]
  cuentas: Cuenta[]
  anticipos: AnticipoCliente[]
}

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n)

export function AnticiposVentaPinaView({
  clientes,
  cuentas,
  anticipos,
}: AnticiposClientesFormProps) {
  const [clienteId, setClienteId] = useState<string>("")
  const [bancoCuentaId, setBancoCuentaId] = useState<string>("")
  const [monto, setMonto] = useState<string>("")
  const [fecha, setFecha] = useState<string>(toDateInput())
  const [fechaDeposito, setFechaDeposito] = useState<string>(toDateInput())
  const [formaPago, setFormaPago] = useState<string>("Transferencia SPEI")
  const [bancoEmisor, setBancoEmisor] = useState<string>("")
  const [noTransferenciaCheque, setNoTransferenciaCheque] = useState<string>("")
  const [observaciones, setObservaciones] = useState<string>("")

  const [isPending, startTransition] = useTransition()

  // Selected client & account
  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => c.id === clienteId),
    [clientes, clienteId]
  )
  const cuentaSeleccionada = useMemo(
    () => cuentas.find((c) => c.id === bancoCuentaId),
    [cuentas, bancoCuentaId]
  )

  // Maps for lookup
  const clientesMap = useMemo(
    () => Object.fromEntries(clientes.map((c) => [c.id, c.nombreRazonSocial])),
    [clientes]
  )
  const cuentasMap = useMemo(
    () => Object.fromEntries(cuentas.map((c) => [c.id, c.nombre])),
    [cuentas]
  )

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

    if (!clienteId) {
      toast.error("Selecciona el cliente.")
      return
    }
    if (!bancoCuentaId) {
      toast.error("Selecciona la cuenta destino.")
      return
    }
    const valMonto = Number(monto)
    if (!valMonto || valMonto <= 0) {
      toast.error("Ingresa un monto de anticipo válido mayor a $0.00.")
      return
    }

    startTransition(async () => {
      const res = await crearAnticipoClienteAction({
        clienteId,
        bancoCuentaId,
        monto: valMonto,
        fecha,
        fechaDeposito,
        formaPago,
        bancoEmisor,
        noTransferenciaCheque,
        observaciones,
      })

      if (res.ok) {
        toast.success("Anticipo de venta de piña registrado exitosamente.")
        setMonto("")
        setNoTransferenciaCheque("")
        setBancoEmisor("")
        setObservaciones("")
      } else {
        toast.error(res.error ?? "No se pudo registrar el anticipo.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      {/* Title Header Matching Screenshot */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <div className="flex items-center gap-2">
            <Receipt className="size-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">
              ANTICIPOS VENTA PIÑA
            </h1>
          </div>
          <p className="text-xs md:text-sm font-semibold text-primary tracking-widest uppercase">
            {todayBanner}
          </p>
        </div>

        {/* Automatic Folio Badge from Screenshot */}
        <div className="flex flex-col items-center md:items-end bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 text-xs">
          <span className="font-bold text-primary tracking-wider uppercase">
            FOLIO: AUTO-01
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            se genera automático
          </span>
        </div>
      </div>

      {/* Main Form Matching Screenshot Layout */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: CLIENTE (Left Column) */}
          <Card className="border-border/80 shadow-xs bg-card flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                <UserCheck className="size-4 text-primary" />
                DATOS DEL CLIENTE
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4 flex-1">
              {/* No. Cliente */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  No. Cliente:
                </label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger className="h-10 text-xs bg-background">
                    <SelectValue placeholder="-- Seleccionar Cliente --" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombreRazonSocial} ({c.rfc})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Info Panel: datos del Cliente */}
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3 flex flex-col gap-1.5 text-xs flex-1">
                <span className="font-bold text-primary uppercase text-[11px] flex items-center gap-1">
                  <Info className="size-3.5" />
                  Datos del Cliente:
                </span>
                {clienteSeleccionado ? (
                  <div className="flex flex-col gap-1 pt-1 text-muted-foreground">
                    <p className="font-semibold text-foreground">{clienteSeleccionado.nombreRazonSocial}</p>
                    <p>RFC: <span className="font-mono text-foreground">{clienteSeleccionado.rfc}</span></p>
                    <p>Dirección: {clienteSeleccionado.direccion || "No especificada"}</p>
                    <p>Tel: {clienteSeleccionado.telefono || "Sin teléfono"}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground/70 italic pt-1">
                    Selecciona un cliente para desplegar sus datos fiscales y de contacto.
                  </p>
                )}
              </div>

              {/* Monto: $ */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Monto: $
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="h-10 text-xs bg-background font-bold text-emerald-600"
                  required
                />
              </div>

              {/* Fecha de la Operación */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Fecha de la Operación:
                </label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-10 text-xs bg-background"
                  required
                />
              </div>

              {/* Observación */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Observación:
                </label>
                <Input
                  type="text"
                  placeholder="Observaciones o notas del anticipo..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="h-10 text-xs bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column: FORMA DE PAGO & CUENTA DESTINO */}
          <div className="flex flex-col gap-6">
            {/* Card 2: FORMA DE PAGO */}
            <Card className="border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                  <CreditCard className="size-4 text-primary" />
                  FORMA DE PAGO
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4">
                {/* Forma de pago */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Forma de pago:
                  </label>
                  <Select value={formaPago} onValueChange={setFormaPago}>
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

                {/* Banco emisor */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Banco emisor:
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej. BBVA / Banamex / Santander"
                    value={bancoEmisor}
                    onChange={(e) => setBancoEmisor(e.target.value)}
                    className="h-9 text-xs bg-background"
                  />
                </div>

                {/* no. Transferencia/cheque */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    no. Transferencia/cheque:
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej. 8890123 / CHQ-409"
                    value={noTransferenciaCheque}
                    onChange={(e) => setNoTransferenciaCheque(e.target.value)}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: CUENTA DESTINO */}
            <Card className="border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                  <Wallet className="size-4 text-primary" />
                  CUENTA DESTINO (RECEPTORA)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4">
                {/* No. Cta */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    No. Cta:
                  </label>
                  <Select value={bancoCuentaId} onValueChange={setBancoCuentaId}>
                    <SelectTrigger className="h-9 text-xs bg-background">
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

                {/* Dynamic info box */}
                <div className="rounded-lg border border-border/60 bg-muted/10 p-3 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Banco receptor:</span>
                    <span className="font-semibold text-foreground">
                      {cuentaSeleccionada?.bancoNombre || cuentaSeleccionada?.nombre || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Beneficiario:</span>
                    <span className="font-semibold text-foreground">
                      {cuentaSeleccionada?.titularNombre || cuentaSeleccionada?.nombre || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/40 pt-1.5 mt-0.5">
                    <span className="text-muted-foreground font-medium">Saldo actual:</span>
                    <span className="font-bold text-emerald-600">
                      {cuentaSeleccionada ? currency(cuentaSeleccionada.saldoInicial) : "—"}
                    </span>
                  </div>
                </div>

                {/* Fecha del depósito */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Fecha del depósito:
                  </label>
                  <Input
                    type="date"
                    value={fechaDeposito}
                    onChange={(e) => setFechaDeposito(e.target.value)}
                    className="h-9 text-xs bg-background"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button (Guardar Anticipo) */}
        <div className="flex justify-center border-t border-border/50 pt-5">
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2 px-10 h-11 text-xs font-black uppercase tracking-wider shadow-sm"
          >
            <Save className="size-4" />
            <span>{isPending ? "GUARDANDO..." : "GUARDAR ANTICIPO"}</span>
          </Button>
        </div>
      </form>

      {/* Historial Table */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Historial de Anticipos de Clientes
            </h2>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {anticipos.length} registros
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-bold">Folio</TableHead>
              <TableHead className="text-xs font-bold">Fecha</TableHead>
              <TableHead className="text-xs font-bold">Cliente</TableHead>
              <TableHead className="text-xs font-bold">Cuenta Destino</TableHead>
              <TableHead className="text-xs font-bold">Forma de Pago</TableHead>
              <TableHead className="text-xs font-bold text-right">Monto ($)</TableHead>
              <TableHead className="text-xs font-bold">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anticipos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                  No hay anticipos registrados aún.
                </TableCell>
              </TableRow>
            ) : (
              anticipos.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs font-mono font-semibold text-primary">
                    {a.folio || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {formatDateShort(a.fecha)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    {clientesMap[a.clienteId] || a.clienteId}
                  </TableCell>
                  <TableCell className="text-xs text-foreground">
                    {cuentasMap[a.bancoCuentaId] || a.bancoCuentaId}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.formaPago}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-emerald-600 text-right tabular-nums">
                    +{currency(a.monto)}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] uppercase font-bold"
                    >
                      {a.estado}
                    </Badge>
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
