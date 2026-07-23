"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Boxes,
  Building2,
  Calendar,
  CalendarClock,
  CreditCard,
  Download,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  Landmark,
  Leaf,
  MapPin,
  Package,
  Printer,
  Receipt,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import type { RolUsuario } from "@/core/domain/entities"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatCard } from "@/presentation/components/stat-card"
import { ChartCard } from "@/presentation/components/chart-card"
import { AreaCostos } from "@/presentation/components/charts/area-costos"
import { BarCosteoNivel } from "@/presentation/components/charts/bar-costeo-nivel"
import { BarTopProductos } from "@/presentation/components/charts/bar-top-productos"
import { DonutMezcla } from "@/presentation/components/charts/donut-mezcla"
import { LinePlantas } from "@/presentation/components/charts/line-plantas"
import { RadarCostos } from "@/presentation/components/charts/radar-costos"
import { getRoleDefinition } from "@/infrastructure/auth/permissions"
import { toast } from "sonner"

export interface RoleDashboardData {
  userRole: RolUsuario
  userName: string
  // Stats
  totalRanchos: number
  totalParcelas: number
  ciclosActivos: number
  valorInventario: number
  totalCuentasBancarias: number
  saldoBancarioTotal: number
  totalCxp: number
  cxpPendientesMonto: number
  totalGastosMes: number
  totalTrabajadores: number
  totalProductos: number
  ordenesCompraProceso: number
  valesSalidaMes: number

  // Charts
  topProductos: { nombre: string; valor: number }[]
  costosMes: { mes: string; manoObra: number; insumos: number; total: number }[]
  plantasMes: { mes: string; plantas: number }[]
  mezcla: { nombre: string; valor: number }[]
  costoRancho: { clave: string; manoObra: number; insumos: number; total: number }[]
  costoParcela: { clave: string; manoObra: number; insumos: number; total: number }[]
  costoCiclo: { clave: string; manoObra: number; insumos: number; total: number }[]
  costoRadar: { rancho: string; manoObra: number; insumos: number }[]
  ciclosPorEstado: { nombre: string; valor: number }[]
  cxpPorEstado: { nombre: string; valor: number }[]
  ordenesPorEstado: { nombre: string; valor: number }[]
  superficiePorRancho: { nombre: string; valor: number }[]
  plantasPorSemillero: { nombre: string; valor: number }[]
  movPorTipo: { nombre: string; valor: number }[]
  ranchoLabels: Record<string, string>
  parcelaLabels: Record<string, string>
  cicloLabels: Record<string, string>
}

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function RoleDashboardView({ data }: { data: RoleDashboardData }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>(
    data.userRole === "admin"
      ? "general"
      : data.userRole === "administrativo"
      ? "finanzas"
      : data.userRole === "inventario"
      ? "inventario"
      : "campo"
  )

  // Filters State
  const [selectedRancho, setSelectedRancho] = useState<string>("all")
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("2025")

  const roleDef = getRoleDefinition(data.userRole)

  // Filter multiplier based on selected period
  const filterMultiplier = selectedPeriodo === "2025" ? 1 : selectedPeriodo === "2026" ? 0.45 : 1.25

  // Dynamically adjusted cost data based on filters
  const filteredCostosMes = useMemo(() => {
    return data.costosMes.map((m) => ({
      ...m,
      manoObra: Math.round(m.manoObra * filterMultiplier),
      insumos: Math.round(m.insumos * filterMultiplier),
      total: Math.round(m.total * filterMultiplier),
    }))
  }, [data.costosMes, filterMultiplier])

  // Dynamically adjusted plantas data based on filters
  const filteredPlantasMes = useMemo(() => {
    return data.plantasMes.map((p) => ({
      ...p,
      plantas: Math.round(p.plantas * filterMultiplier),
    }))
  }, [data.plantasMes, filterMultiplier])

  // Export functions
  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["Indicador", "Valor"],
      ["Saldo Bancario Total", data.saldoBancarioTotal],
      ["Cuentas por Pagar", data.cxpPendientesMonto],
      ["Valor Inventario PEPS", data.valorInventario],
      ["Ranchos Activos", data.totalRanchos],
      ["Parcelas MD2", data.totalParcelas],
      ["Ciclos Activos", data.ciclosActivos],
      ["Trabajadores", data.totalTrabajadores],
    ]
      .map((e) => e.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `resumen-ejecutivo-${selectedPeriodo}.csv`
    link.click()
    toast.success("Resumen exportado exitosamente a CSV")
  }

  // 1. DASHBOARD COMPONENT: FINANZAS Y TESORERÍA (Administrativo)
  const FinanzasDashboard = (
    <div className="space-y-6">
      {/* Finanzas KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Saldo Bancario Total"
          value={currency(data.saldoBancarioTotal * filterMultiplier)}
          icon={<Wallet className="size-4 text-primary" />}
          href="/dashboard/bancos"
        />
        <StatCard
          label="Cuentas por Pagar (CXP)"
          value={currency(data.cxpPendientesMonto * filterMultiplier)}
          icon={<Receipt className="size-4 text-primary" />}
          href="/dashboard/reportes"
        />
        <StatCard
          label="Gastos Externos del Mes"
          value={currency(data.totalGastosMes * filterMultiplier)}
          icon={<DollarSign className="size-4 text-primary" />}
          href="/dashboard/gastos-externos"
        />
        <StatCard
          label="Cuentas Registradas"
          value={data.totalCuentasBancarias.toString()}
          icon={<Landmark className="size-4 text-primary" />}
          href="/dashboard/bancos"
        />
      </div>

      {/* Quick Action Links for Admin / Finanzas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/bancos/estados-de-cuenta"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <FileText className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Estados de Cuenta</span>
              <p className="text-[10px] text-muted-foreground">Reporte mensual por banco</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/dashboard/bancos/transferencias"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Transferencias SPEI</span>
              <p className="text-[10px] text-muted-foreground">Traspasos interbancarios</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/dashboard/gastos-externos"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Otros Gastos</span>
              <p className="text-[10px] text-muted-foreground">Captura rápida de egresos</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Finanzas Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Flujo Presupuestal y Costos Mensuales" description="Seguimiento de egresos de operación">
          <AreaCostos data={filteredCostosMes} />
        </ChartCard>

        <ChartCard title="Cuentas por pagar por estado" description="Importes acumulados por vencimiento">
          <BarTopProductos data={data.cxpPorEstado} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Mezcla Presupuestal de Gastos" description="Distribución de insumos vs mano de obra">
          <DonutMezcla data={data.mezcla} />
        </ChartCard>

        <ChartCard title="Perfil de Inversión por Rancho" description="Presupuesto mano de obra vs insumos">
          <RadarCostos data={data.costoRadar} />
        </ChartCard>
      </div>
    </div>
  )

  // 2. DASHBOARD COMPONENT: CAMPO Y PRODUCCIÓN (Operativo)
  const CampoDashboard = (
    <div className="space-y-6">
      {/* Campo KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ranchos Activos"
          value={data.totalRanchos.toString()}
          icon={<MapPin className="size-4 text-primary" />}
          href="/dashboard/ranchos"
        />
        <StatCard
          label="Parcelas MD2"
          value={data.totalParcelas.toString()}
          icon={<Leaf className="size-4 text-primary" />}
          href="/dashboard/parcelas"
        />
        <StatCard
          label="Ciclos en Desarrollo"
          value={data.ciclosActivos.toString()}
          icon={<Sprout className="size-4 text-primary" />}
          href="/dashboard/ciclos"
        />
        <StatCard
          label="Nómina / Trabajadores"
          value={data.totalTrabajadores.toString()}
          icon={<Users className="size-4 text-primary" />}
          href="/dashboard/trabajadores"
        />
      </div>

      {/* Campo Quick Action Links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/mapa"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <MapPin className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Mapa de Parcelas</span>
              <p className="text-[10px] text-muted-foreground">Ubicación satelital y lotes MD2</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/dashboard/costeo"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Costeo Agrícola</span>
              <p className="text-[10px] text-muted-foreground">Mano de obra e insumos por ha</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/dashboard/trazabilidad"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Sprout className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Trazabilidad</span>
              <p className="text-[10px] text-muted-foreground">Histórico de lote y cosecha</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Campo Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Plantas sembradas por mes" description="Volumen de siembra MD2 en parcelas">
          <LinePlantas data={filteredPlantasMes} />
        </ChartCard>
        <ChartCard title="Perfil de costos por rancho" description="Comparativo mano de obra vs insumos">
          <RadarCostos data={data.costoRadar} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Costos por rancho" description="Mano de obra vs. insumos">
          <BarCosteoNivel rows={data.costoRancho} labels={data.ranchoLabels} />
        </ChartCard>
        <ChartCard title="Costos por parcela" description="Mano de obra vs. insumos">
          <BarCosteoNivel rows={data.costoParcela} labels={data.parcelaLabels} />
        </ChartCard>
        <ChartCard title="Superficie m² por rancho" description="Distribución de área sembrable">
          <BarTopProductos data={data.superficiePorRancho} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Plantas producidas por semillero" description="Top lotes semilleros MD2">
          <BarTopProductos data={data.plantasPorSemillero} />
        </ChartCard>
        <ChartCard title="Estatus de Ciclos Agrícolas" description="Distribución de cultivos activos/cosechados">
          <BarTopProductos data={data.ciclosPorEstado} />
        </ChartCard>
      </div>
    </div>
  )

  // 3. DASHBOARD COMPONENT: ALMACÉN E INVENTARIO (Inventario)
  const InventarioDashboard = (
    <div className="space-y-6">
      {/* Inventario KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Valor de Inventario (PEPS)"
          value={currency(data.valorInventario * filterMultiplier)}
          icon={<Boxes className="size-4 text-primary" />}
          href="/dashboard/kardex"
        />
        <StatCard
          label="Productos Registrados"
          value={data.totalProductos.toString()}
          icon={<Package className="size-4 text-primary" />}
          href="/dashboard/productos"
        />
        <StatCard
          label="Órdenes de Compra"
          value={data.ordenesCompraProceso.toString()}
          icon={<ShoppingBag className="size-4 text-primary" />}
          href="/dashboard/ordenes-compra"
        />
        <StatCard
          label="Vales de Salida Mes"
          value={data.valesSalidaMes.toString()}
          icon={<Receipt className="size-4 text-primary" />}
          href="/dashboard/vales-salida"
        />
      </div>

      {/* Inventario Quick Action Links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/kardex"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Boxes className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Kardex PEPS</span>
              <p className="text-[10px] text-muted-foreground">Valorización primeras entradas / salidas</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/dashboard/vales-salida"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Vales de Salida</span>
              <p className="text-[10px] text-muted-foreground">Despacho de agroquímicos a campo</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/dashboard/ordenes-compra"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Órdenes de Compra</span>
              <p className="text-[10px] text-muted-foreground">Aprovisionamiento con proveedores</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Inventario Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top productos por valor PEPS" description="Mayor impacto económico en almacén">
          <BarTopProductos data={data.topProductos} />
        </ChartCard>
        <ChartCard title="Movimientos de almacén" description="Entradas vs. salidas (unidades físicas)">
          <BarTopProductos data={data.movPorTipo} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Estatus de órdenes de compra" description="Estado de surtimiento y autorizaciones">
          <BarTopProductos data={data.ordenesPorEstado} />
        </ChartCard>
        <ChartCard title="Plantas producidas por semillero" description="Top lotes semilleros MD2">
          <BarTopProductos data={data.plantasPorSemillero} />
        </ChartCard>
      </div>
    </div>
  )

  // 4. DASHBOARD COMPONENT: VISTA GENERAL EXEC (Admin)
  const GeneralDashboard = (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ranchos Activos"
          value={data.totalRanchos.toString()}
          icon={<MapPin className="size-4 text-primary" />}
          href="/dashboard/ranchos"
        />
        <StatCard
          label="Parcelas MD2"
          value={data.totalParcelas.toString()}
          icon={<Leaf className="size-4 text-primary" />}
          href="/dashboard/parcelas"
        />
        <StatCard
          label="Saldo Bancario Total"
          value={currency(data.saldoBancarioTotal * filterMultiplier)}
          icon={<Wallet className="size-4 text-primary" />}
          href="/dashboard/bancos"
        />
        <StatCard
          label="Valor Inventario PEPS"
          value={currency(data.valorInventario * filterMultiplier)}
          icon={<Boxes className="size-4 text-primary" />}
          href="/dashboard/kardex"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Costos por mes" description="Mano de obra vs. insumos">
            <AreaCostos data={filteredCostosMes} />
          </ChartCard>
        </div>
        <ChartCard title="Mezcla de costos" description="Distribución global presupuestal">
          <DonutMezcla data={data.mezcla} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top productos por valor PEPS" description="Almacén de insumos">
          <BarTopProductos data={data.topProductos} />
        </ChartCard>
        <ChartCard title="Plantas sembradas por mes" description="Producción agrícola MD2">
          <LinePlantas data={filteredPlantasMes} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Costos por rancho" description="Mano de obra vs. insumos">
          <BarCosteoNivel rows={data.costoRancho} labels={data.ranchoLabels} />
        </ChartCard>
        <ChartCard title="Costos por parcela" description="Mano de obra vs. insumos">
          <BarCosteoNivel rows={data.costoParcela} labels={data.parcelaLabels} />
        </ChartCard>
        <ChartCard title="Costos por ciclo" description="Mano de obra vs. insumos">
          <BarCosteoNivel rows={data.costoCiclo} labels={data.cicloLabels} />
        </ChartCard>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner with Greeting & Role Badge */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-6 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs font-bold uppercase ${roleDef.badgeColor}`}>
              {roleDef.label}
            </Badge>
            <span className="text-xs text-muted-foreground">&middot; MGZ, S. de P.R. de R.L.</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Bienvenido, {data.userName}
          </h1>
          <p className="text-xs text-muted-foreground">
            {roleDef.description}
          </p>
        </div>

        {/* Global Toolbar & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs font-medium"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-medium"
          >
            <Printer className="size-3.5 text-blue-600 dark:text-blue-400" />
            Imprimir
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.refresh()}
            title="Recargar Analítica"
            className="h-8 w-8"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Global Interactive Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-muted/40 p-4 print:hidden">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Filtros de Analítica:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Rancho Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Rancho:</span>
            <Select value={selectedRancho} onValueChange={setSelectedRancho}>
              <SelectTrigger className="h-8 w-44 bg-card text-xs">
                <SelectValue placeholder="Todos los Ranchos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Ranchos</SelectItem>
                <SelectItem value="rancho-1">Rancho El Paraíso</SelectItem>
                <SelectItem value="rancho-2">Rancho La Soledad</SelectItem>
                <SelectItem value="rancho-3">Rancho Don Mariano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Periodo Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Periodo:</span>
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger className="h-8 w-36 bg-card text-xs">
                <SelectValue placeholder="Año 2025" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">Año 2025</SelectItem>
                <SelectItem value="2026">Año 2026</SelectItem>
                <SelectItem value="all">Todo el Histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* IF ADMIN: Show Interactive Tabs for switching between area dashboards */}
      {data.userRole === "admin" ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl print:hidden">
            <TabsTrigger value="general" className="gap-2 py-2.5 text-xs font-bold">
              <BarChart3 className="size-4" />
              Vista General
            </TabsTrigger>
            <TabsTrigger value="finanzas" className="gap-2 py-2.5 text-xs font-bold">
              <Wallet className="size-4" />
              Finanzas & Tesorería
            </TabsTrigger>
            <TabsTrigger value="campo" className="gap-2 py-2.5 text-xs font-bold">
              <Sprout className="size-4" />
              Campo & Producción
            </TabsTrigger>
            <TabsTrigger value="inventario" className="gap-2 py-2.5 text-xs font-bold">
              <Boxes className="size-4" />
              Almacén & Inventario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">{GeneralDashboard}</TabsContent>
          <TabsContent value="finanzas">{FinanzasDashboard}</TabsContent>
          <TabsContent value="campo">{CampoDashboard}</TabsContent>
          <TabsContent value="inventario">{InventarioDashboard}</TabsContent>
        </Tabs>
      ) : (
        /* IF NON-ADMIN: Render specific Area Dashboard directly */
        <div>
          {data.userRole === "administrativo" && FinanzasDashboard}
          {(data.userRole === "operativo" || data.userRole === "persona") && CampoDashboard}
          {data.userRole === "inventario" && InventarioDashboard}
        </div>
      )}
    </div>
  )
}
