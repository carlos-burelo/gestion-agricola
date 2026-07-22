"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  Landmark,
  Printer,
  Receipt,
  Search,
  Wallet,
} from "lucide-react"
import type {
  AbonoCliente,
  CargoComision,
  Cuenta,
  GastoExterno,
  Movimiento,
  TransferenciaHijuelos,
  Traspaso,
} from "@/core/domain/entities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface BankMovementItem {
  id: string
  fecha: string
  tipo: "deposito" | "retiro"
  categoria: string
  concepto: string
  folio: string
  monto: number
}

export interface BancosEstadosCuentaViewProps {
  cuentas: Cuenta[]
  movimientos: Movimiento[]
  cargosComisiones: CargoComision[]
  transferenciasHijuelos: TransferenciaHijuelos[]
  traspasos: Traspaso[]
  gastosExternos: GastoExterno[]
  abonosClientes: AbonoCliente[]
}

export function BancosEstadosCuentaView({
  cuentas,
  movimientos,
  cargosComisiones,
  transferenciasHijuelos,
  traspasos,
  gastosExternos,
  abonosClientes,
}: BancosEstadosCuentaViewProps) {
  // State Filters
  const [selectedCuentaId, setSelectedCuentaId] = useState<string>(cuentas[0]?.id ?? "")
  const [desde, setDesde] = useState("2025-01-01")
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0])
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "deposito" | "retiro">("todos")
  const [searchTerm, setSearchTerm] = useState("")

  const selectedCuenta = cuentas.find((c) => c.id === selectedCuentaId)

  // Build Unified Account Ledger
  const ledger = useMemo(() => {
    if (!selectedCuentaId) return []
    const items: BankMovementItem[] = []

    // 1. Direct Treasury Movimientos
    for (const m of movimientos) {
      if (m.cuentaId === selectedCuentaId) {
        items.push({
          id: `mov-${m.id}`,
          fecha: m.fecha.split("T")[0],
          tipo: m.tipo === "ingreso" ? "deposito" : "retiro",
          categoria: "Movimiento de Tesorería",
          concepto: m.concepto || "Operación de Tesorería",
          folio: m.id.slice(-6).toUpperCase(),
          monto: m.monto,
        })
      }
    }

    // 2. Cargos y Comisiones
    for (const c of cargosComisiones) {
      if (c.bancoCuentaId === selectedCuentaId) {
        items.push({
          id: `cargo-${c.id}`,
          fecha: c.fecha.split("T")[0],
          tipo: "retiro",
          categoria: "Comisión Bancaria",
          concepto: c.observaciones || "Comisión e IVA por manejo de cuenta",
          folio: c.folio || `CARGO-${c.id.slice(-4)}`,
          monto: c.monto,
        })
      }
    }

    // 3. Transferencias Fiscales Hijuelos
    for (const t of transferenciasHijuelos) {
      if (t.cuentaOrigenId === selectedCuentaId) {
        items.push({
          id: `trans-orig-${t.id}`,
          fecha: t.fecha.split("T")[0],
          tipo: "retiro",
          categoria: "Transferencia de Salida",
          concepto: t.conceptoFiscal || "Compra de hijuelos de piña",
          folio: t.folioFiscal || `TRANS-${t.id.slice(-4)}`,
          monto: t.monto,
        })
      }
      if (t.cuentaDestinoId === selectedCuentaId) {
        items.push({
          id: `trans-dest-${t.id}`,
          fecha: t.fecha.split("T")[0],
          tipo: "deposito",
          categoria: "Transferencia de Entrada",
          concepto: t.conceptoFiscal || "Recepción de fondos hijuelos",
          folio: t.folioFiscal || `TRANS-${t.id.slice(-4)}`,
          monto: t.monto,
        })
      }
    }

    // 4. Traspasos entre cuentas
    for (const tr of traspasos) {
      if (tr.cuentaOrigenId === selectedCuentaId) {
        items.push({
          id: `trasp-orig-${tr.id}`,
          fecha: tr.fecha.split("T")[0],
          tipo: "retiro",
          categoria: "Traspaso Saliente",
          concepto: tr.concepto || "Traspaso a otra cuenta bancaria",
          folio: `TRASP-${tr.id.slice(-4)}`,
          monto: tr.monto,
        })
      }
      if (tr.cuentaDestinoId === selectedCuentaId) {
        items.push({
          id: `trasp-dest-${tr.id}`,
          fecha: tr.fecha.split("T")[0],
          tipo: "deposito",
          categoria: "Traspaso Entrante",
          concepto: tr.concepto || "Recepción de traspaso de fondos",
          folio: `TRASP-${tr.id.slice(-4)}`,
          monto: tr.monto,
        })
      }
    }

    // 5. Gastos Externos / Operativos / Familiares
    for (const g of gastosExternos) {
      if (g.bancoCuentaId === selectedCuentaId) {
        items.push({
          id: `gasto-${g.id}`,
          fecha: g.fecha.split("T")[0],
          tipo: "retiro",
          categoria: `Gasto ${g.tipoGasto.toUpperCase()}`,
          concepto: g.observaciones || "Pago de gasto registrado",
          folio: g.folioFactura || `FAC-${g.id.slice(-4)}`,
          monto: g.monto,
        })
      }
    }

    // 6. Abonos de Clientes (Ingresos por Venta Piña)
    for (const ab of abonosClientes) {
      if (ab.bancoCuentaId === selectedCuentaId) {
        items.push({
          id: `abono-${ab.id}`,
          fecha: ab.fecha.split("T")[0],
          tipo: "deposito",
          categoria: "Abono de Cliente (Venta Piña)",
          concepto: `Cobro de venta / Abono de cliente`,
          folio: ab.folio || `SPEI-${ab.id.slice(-4)}`,
          monto: ab.monto,
        })
      }
    }

    // Sort Chronologically Ascending
    return items.sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [
    selectedCuentaId,
    movimientos,
    cargosComisiones,
    transferenciasHijuelos,
    traspasos,
    gastosExternos,
    abonosClientes,
  ])

  // Filter Movements by Date Range, Type and Search
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const matchesDate = item.fecha >= desde && item.fecha <= hasta
      const matchesTipo = tipoFiltro === "todos" || item.tipo === tipoFiltro
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        item.concepto.toLowerCase().includes(search) ||
        item.categoria.toLowerCase().includes(search) ||
        item.folio.toLowerCase().includes(search)
      return matchesDate && matchesTipo && matchesSearch
    })
  }, [ledger, desde, hasta, tipoFiltro, searchTerm])

  // Calculate Running Balance and Summary Statistics
  const saldoInicial = selectedCuenta?.saldoInicial ?? 0

  const summary = useMemo(() => {
    let totalDepositos = 0
    let totalRetiros = 0

    for (const item of filteredLedger) {
      if (item.tipo === "deposito") {
        totalDepositos += item.monto
      } else {
        totalRetiros += item.monto
      }
    }

    const saldoFinal = saldoInicial + totalDepositos - totalRetiros
    return { totalDepositos, totalRetiros, saldoFinal }
  }, [filteredLedger, saldoInicial])

  // Compute Running Balance for Table Rows
  let currentRunningBalance = saldoInicial
  const rowsWithBalance = filteredLedger.map((item) => {
    if (item.tipo === "deposito") {
      currentRunningBalance += item.monto
    } else {
      currentRunningBalance -= item.monto
    }
    return {
      ...item,
      runningBalance: currentRunningBalance,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold uppercase">
              Módulo de Bancos
            </Badge>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Estados de Cuenta Bancarios
          </h1>
          <p className="text-xs text-muted-foreground">
            Reporte oficial de movimientos, depósitos, retiros y saldo diario acumulado por institución bancaria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="size-4" />
            Imprimir Reporte
          </Button>
        </div>
      </div>

      {/* Control Filters Bar - Clean Solid Style (No Heavy Gradients) */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            Filtros de Estado de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {/* Cuenta Bancaria Select */}
            <div className="space-y-1.5 lg:col-span-4">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Landmark className="size-3.5 text-primary" />
                Cuenta / Banco Emisor
              </Label>
              <Select value={selectedCuentaId} onValueChange={setSelectedCuentaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona cuenta bancaria" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {(c.bancoNombre || c.nombre)} &middot; {c.nombre} ({c.moneda})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Desde */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                Desde
              </Label>
              <Input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                Hasta
              </Label>
              <Input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Tipo de Movimiento Filter */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs font-semibold text-foreground">
                Tipo Movimiento
              </Label>
              <Select
                value={tipoFiltro}
                onValueChange={(val: "todos" | "deposito" | "retiro") => setTipoFiltro(val)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="deposito">Solo Depósitos (+)</SelectItem>
                  <SelectItem value="retiro">Solo Retiros (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs font-semibold text-foreground">
                Búsqueda
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Concepto..."
                  className="pl-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Account Detail Sub-Bar */}
          {selectedCuenta && (
            <div className="flex flex-wrap items-center justify-between rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-bold">
                  {selectedCuenta.bancoNombre || "Efectivo"}
                </Badge>
                <span className="font-semibold text-foreground">
                  Titular: {selectedCuenta.titularNombre || selectedCuenta.nombre}
                </span>
                <span className="font-mono text-muted-foreground">
                  Núm. Cuenta: {selectedCuenta.numeroCuenta || "CAJA CHICA"}
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-foreground">
                Moneda: {selectedCuenta.moneda}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Inicial */}
        <Card className="border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Saldo Inicial</span>
            <Wallet className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-foreground">
            ${saldoInicial.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-muted-foreground">Al inicio del periodo</span>
        </Card>

        {/* Depósitos / Abonos */}
        <Card className="border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Depósitos (+)</span>
            <ArrowDownRight className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            +${summary.totalDepositos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Entradas y cobros abonados
          </span>
        </Card>

        {/* Retiros / Egresos */}
        <Card className="border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Retiros (-)</span>
            <ArrowUpRight className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            -${summary.totalRetiros.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
            Salidas, comisiones y pagos
          </span>
        </Card>

        {/* Saldo Final Resultante */}
        <Card className="border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Saldo Final Calculado</span>
            <DollarSign className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-foreground">
            ${summary.saldoFinal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-muted-foreground">Saldo neto proyectado</span>
        </Card>
      </div>

      {/* Account Statement Ledger Table */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Estado de Cuenta Detallado
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Desglose cronológico de movimientos para {selectedCuenta?.nombre || "la cuenta seleccionada"}.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {rowsWithBalance.length} Movimientos
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/60 font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Folio / Ref</th>
                  <th className="p-3.5">Categoría</th>
                  <th className="p-3.5">Concepto / Descripción</th>
                  <th className="p-3.5 text-right">Depósito (+)</th>
                  <th className="p-3.5 text-right">Retiro (-)</th>
                  <th className="p-3.5 text-right">Saldo ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rowsWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No hay movimientos registrados para esta cuenta en el periodo seleccionado.
                    </td>
                  </tr>
                ) : (
                  rowsWithBalance.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-muted/40">
                      <td className="p-3.5 font-mono font-medium">
                        {item.fecha}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-foreground">
                        {item.folio}
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {item.categoria}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-medium text-foreground max-w-xs truncate">
                        {item.concepto}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.tipo === "deposito"
                          ? `+$${item.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                          : "-"}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {item.tipo === "retiro"
                          ? `-$${item.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                          : "-"}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-foreground">
                        ${item.runningBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
