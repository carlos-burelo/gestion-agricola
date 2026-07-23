"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  Receipt,
  Repeat2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import type { Categoria, Cuenta, Movimiento } from "@/core/domain/entities"
import { BankCardCarousel } from "@/presentation/components/bank-card-carousel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/dates"

export interface BankingDashboardProps {
  cuentas: Cuenta[]
  saldos: Record<string, number>
  movimientosRecientes: Movimiento[]
  categorias: Categoria[]
  isAdmin: boolean
}

/**
 * State-of-the-art Neumorphic & Glassmorphic Banking App Dashboard interface.
 */
export function BankingDashboard({
  cuentas,
  saldos,
  movimientosRecientes,
  categorias,
  isAdmin,
}: BankingDashboardProps) {
  const [showTotalBalance, setShowTotalBalance] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "entrada" | "salida" | "traspaso">("all")

  // Map category IDs to names
  const categoryMap = new Map(categorias.map((c) => [c.id, c.nombre]))
  const accountMap = new Map(cuentas.map((c) => [c.id, c.nombre]))

  // Calculate Net Worth (Total balance across all accounts)
  const totalBalance = cuentas.reduce(
    (acc, c) => acc + (saldos[c.id] ?? c.saldoInicial),
    0
  )

  // Calculate monthly stats
  const totalEntradas = movimientosRecientes
    .filter((m) => m.direccion === "entrada")
    .reduce((acc, m) => acc + m.monto, 0)

  const totalSalidas = movimientosRecientes
    .filter((m) => m.direccion === "salida")
    .reduce((acc, m) => acc + m.monto, 0)

  // Filtered movements for the activity feed
  const filteredMovements = movimientosRecientes.filter((m) => {
    const categoryName = categoryMap.get(m.categoriaId) ?? ""
    const accountName = accountMap.get(m.cuentaId) ?? ""
    const matchesSearch =
      categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.beneficiario ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.descripcion ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.folio ?? "").toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false
    if (filterType === "entrada") return m.direccion === "entrada" && !m.traspasoId
    if (filterType === "salida") return m.direccion === "salida" && !m.traspasoId
    if (filterType === "traspaso") return Boolean(m.traspasoId)
    return true
  })

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* 1. FinTech Hero Header & Net Worth Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-xs">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Banca Digital MGZ · Tesorería
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                {showTotalBalance
                  ? totalBalance.toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })
                  : "••••••••••••"}
              </h1>
              <button
                type="button"
                onClick={() => setShowTotalBalance(!showTotalBalance)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                {showTotalBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Patrimonio Líquido Consolidado ({cuentas.length} cuentas activas)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 px-4 py-3 backdrop-blur-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400/80">Ingresos</span>
                <p className="text-sm font-bold text-emerald-300">
                  +{totalEntradas.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/40 px-4 py-3 backdrop-blur-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400/80">Egresos</span>
                <p className="text-sm font-bold text-rose-300">
                  -{totalSalidas.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-6">
          {isAdmin && (
            <Button
              asChild
              className="rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-xs"
            >
              <Link href="/dashboard/bancos/transferencias">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Hacer Traspaso
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            className="rounded-xl border-slate-700 bg-slate-900/60 text-white hover:bg-slate-800 hover:text-white"
          >
            <Link href="/dashboard/catalogos?tab=cuentas">
              <Plus className="mr-2 h-4 w-4 text-emerald-400" />
              Nueva Cuenta
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="rounded-xl border-slate-700 bg-slate-900/60 text-white hover:bg-slate-800 hover:text-white"
          >
            <Link href="/dashboard/tesoreria/reportes/mensual">
              <Receipt className="mr-2 h-4 w-4 text-blue-400" />
              Estado de Cuenta
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Wallet & Single Active Card Carousel Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Tarjetero & Cuentas</h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Muestra 1 tarjeta a la vez (Desliza con flechas o botones)
          </span>
        </div>

        {/* Bank Card Swiper (1 Card Focused) */}
        <BankCardCarousel
          cuentas={cuentas}
          saldos={saldos}
          readOnly={!isAdmin}
        />
      </div>

      {/* 3. Bank Feed / Recent Activity */}
      <Card className="shadow-xs border-muted/60">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Movimientos Recientes en Tiempo Real
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trazabilidad bancaria de ingresos, egresos y traspasos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar beneficiario, folio..."
                className="pl-8 h-9 w-48 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filterType === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("entrada")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filterType === "entrada" ? "bg-background text-emerald-600 shadow-xs" : "text-muted-foreground"
                }`}
              >
                Ingresos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("salida")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filterType === "salida" ? "bg-background text-rose-600 shadow-xs" : "text-muted-foreground"
                }`}
              >
                Egresos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("traspaso")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filterType === "traspaso" ? "bg-background text-indigo-600 shadow-xs" : "text-muted-foreground"
                }`}
              >
                Traspasos
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Receipt className="h-10 w-10 stroke-1 opacity-40 mb-2" />
              <p className="text-sm font-medium">No se encontraron movimientos registrados</p>
              <p className="text-xs opacity-75">Intenta cambiar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredMovements.map((m) => {
                const isEntrada = m.direccion === "entrada"
                const isTraspaso = Boolean(m.traspasoId)
                const categoryName = isTraspaso
                  ? "Traspaso entre Cuentas"
                  : categoryMap.get(m.categoriaId) ?? "Categoría General"
                const accountName = accountMap.get(m.cuentaId) ?? "Cuenta"

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-3.5 px-2 transition hover:bg-muted/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl font-bold ${
                          isTraspaso
                            ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                            : isEntrada
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        }`}
                      >
                        {isTraspaso ? (
                          <Repeat2 className="h-5 w-5" />
                        ) : isEntrada ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">
                            {categoryName}
                          </p>
                          {m.folio && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              {m.folio}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {accountName} {m.beneficiario ? `· ${m.beneficiario}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-extrabold tracking-tight ${
                          isTraspaso
                            ? "text-indigo-600"
                            : isEntrada
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {isEntrada ? "+" : "-"}
                        {m.monto.toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(m.fecha)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
