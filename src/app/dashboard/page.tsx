import { Boxes, Leaf, MapPin, Sprout } from "lucide-react"
import type {
  Ciclo,
  CuentaPorPagar,
  MovimientoInventario,
  OrdenCompra,
  Parcela,
  Rancho,
  Semillero,
} from "@/core/domain/entities"
import {
  analyticsService,
  costingService,
  inventoryService,
} from "@/infrastructure/container"
import { ChartCard } from "@/presentation/components/chart-card"
import { AreaCostos } from "@/presentation/components/charts/area-costos"
import { BarCosteoNivel } from "@/presentation/components/charts/bar-costeo-nivel"
import { BarTopProductos } from "@/presentation/components/charts/bar-top-productos"
import { DonutMezcla } from "@/presentation/components/charts/donut-mezcla"
import { LinePlantas } from "@/presentation/components/charts/line-plantas"
import { RadarCostos } from "@/presentation/components/charts/radar-costos"
import { PageHeader } from "@/presentation/components/page-header"
import { StatCard } from "@/presentation/components/stat-card"
import { loadRecords } from "@/presentation/queries"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const labelsOf = <T extends { id: string }>(
  rows: T[],
  pick: (r: T) => string,
): Record<string, string> => Object.fromEntries(rows.map((r) => [r.id, pick(r)]))

export default async function DashboardHome() {
  const analytics = analyticsService()
  const costing = costingService()
  const [
    ranchos,
    parcelas,
    ciclos,
    semilleros,
    cuentas,
    ordenes,
    movimientos,
    existencias,
    costosMes,
    plantasMes,
    mezcla,
    costoRancho,
    costoParcela,
    costoCiclo,
  ] = await Promise.all([
    loadRecords<Rancho>("ranchos"),
    loadRecords<Parcela>("parcelas"),
    loadRecords<Ciclo>("ciclos"),
    loadRecords<Semillero>("semilleros"),
    loadRecords<CuentaPorPagar>("cuentasPorPagar"),
    loadRecords<OrdenCompra>("ordenesCompra"),
    loadRecords<MovimientoInventario>("movimientosInventario"),
    inventoryService().existencias(),
    analytics.costosPorMes(),
    analytics.plantasPorMes(),
    analytics.mezclaCostos(),
    costing.resumenPorNivel("ranchoId"),
    costing.resumenPorNivel("parcelaId"),
    costing.resumenPorNivel("cicloId"),
  ])

  // Label maps built directly from records (id -> readable name).
  const ranchoLabels = labelsOf(ranchos, (r) => r.nombre)
  const parcelaLabels = labelsOf(parcelas, (p) => p.identificador)
  const cicloLabels = labelsOf(
    ciclos,
    (c) => parcelaLabels[c.parcelaId] ?? c.id,
  )

  const valorInventario = existencias.reduce((a, e) => a + e.valorInventario, 0)
  const ciclosActivos = ciclos.filter((c) => c.estado === "activo").length

  const topProductos = [...existencias]
    .sort((a, b) => b.valorInventario - a.valorInventario)
    .slice(0, 6)
    .map((e) => ({
      nombre: e.producto.nombreComercial,
      valor: Math.round(e.valorInventario),
    }))

  const sparkCostos = costosMes.map((m) => m.total)
  const totalPlantas = plantasMes.reduce((a, b) => a + b.plantas, 0)

  // Radar: mano de obra vs insumos por rancho (nombre corto sin "Rancho ").
  const costoRadar = costoRancho.map((r) => ({
    rancho: (ranchoLabels[r.clave] ?? r.clave).replace(/^Rancho\s+/i, ""),
    manoObra: Math.round(r.manoObra),
    insumos: Math.round(r.insumos),
  }))

  // Distribuciones por estado / agrupaciones (derivadas de datos reales).
  const ciclosPorEstado = (
    ["planeado", "activo", "cosechado", "cerrado"] as const
  )
    .map((e) => ({ nombre: cap(e), valor: ciclos.filter((c) => c.estado === e).length }))
    .filter((x) => x.valor > 0)

  const cxpPorEstado = (["pendiente", "pagada", "vencida"] as const)
    .map((e) => ({
      nombre: cap(e),
      valor: Math.round(
        cuentas.filter((c) => c.estado === e).reduce((a, c) => a + c.importe, 0),
      ),
    }))
    .filter((x) => x.valor > 0)

  const ordenesPorEstado = (
    ["borrador", "autorizada", "parcial", "surtida", "cancelada"] as const
  )
    .map((e) => ({ nombre: cap(e), valor: ordenes.filter((o) => o.estado === e).length }))
    .filter((x) => x.valor > 0)

  const superficiePorRancho = ranchos
    .map((r) => ({
      nombre: r.nombre,
      valor: Math.round(
        parcelas
          .filter((p) => p.ranchoId === r.id)
          .reduce((a, p) => a + p.superficieM2, 0),
      ),
    }))
    .filter((x) => x.valor > 0)

  const plantasPorSemillero = [...semilleros]
    .sort((a, b) => b.plantasProducidas - a.plantasProducidas)
    .slice(0, 8)
    .map((s) => ({
      nombre: parcelaLabels[s.parcelaId] ?? s.id,
      valor: s.plantasProducidas,
    }))

  const movPorTipo = [
    {
      nombre: "Entradas",
      valor: Math.round(
        movimientos
          .filter((m) => m.tipo === "entrada")
          .reduce((a, m) => a + m.cantidad, 0),
      ),
    },
    {
      nombre: "Salidas",
      valor: Math.round(
        movimientos
          .filter((m) => m.tipo === "salida")
          .reduce((a, m) => a + m.cantidad, 0),
      ),
    },
  ].filter((x) => x.valor > 0)

  const iconCls = "size-4 text-primary"
  const stats = [
    {
      label: "Ranchos",
      value: ranchos.length.toString(),
      icon: <MapPin className={iconCls} />,
      href: "/dashboard/ranchos",
    },
    {
      label: "Parcelas",
      value: parcelas.length.toString(),
      icon: <Leaf className={iconCls} />,
      href: "/dashboard/parcelas",
    },
    {
      label: "Ciclos activos",
      value: ciclosActivos.toString(),
      icon: <Sprout className={iconCls} />,
      href: "/dashboard/ciclos",
    },
    {
      label: "Valor de inventario",
      value: currency(valorInventario),
      icon: <Boxes className={iconCls} />,
      href: "/dashboard/kardex",
      spark: sparkCostos,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        badge="MGZ, S. de P.R. de R.L."
        title="Producción de Piña"
        description="Indicadores y analítica de costos, inventario y producción por rancho, parcela, plantilla y ciclo."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Costos por mes" description="Mano de obra vs. insumos">
            <AreaCostos data={costosMes} />
          </ChartCard>
        </div>
        <ChartCard title="Mezcla de costos" description="Distribución global">
          <DonutMezcla data={mezcla} />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Top productos por valor"
          description="Valor de inventario (PEPS)"
        >
          <BarTopProductos data={topProductos} />
        </ChartCard>
        <ChartCard
          title="Plantas sembradas por mes"
          description={`${totalPlantas.toLocaleString("es-MX")} plantas en total`}
        >
          <LinePlantas data={plantasMes} />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Costos por rancho" description="Mano de obra vs. insumos">
          <BarCosteoNivel rows={costoRancho} labels={ranchoLabels} />
        </ChartCard>
        <ChartCard title="Costos por parcela" description="Mano de obra vs. insumos">
          <BarCosteoNivel rows={costoParcela} labels={parcelaLabels} />
        </ChartCard>
        <ChartCard title="Costos por ciclo" description="Mano de obra vs. insumos">
          <BarCosteoNivel rows={costoCiclo} labels={cicloLabels} />
        </ChartCard>
      </section>

      <section>
        <ChartCard
          title="Perfil de costos por rancho"
          description="Comparativo mano de obra vs. insumos por unidad productiva"
        >
          <RadarCostos data={costoRadar} />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Ciclos por estado" description="Distribución de cultivos">
          <BarTopProductos data={ciclosPorEstado} />
        </ChartCard>
        <ChartCard
          title="Órdenes de compra por estado"
          description="Conteo por estado"
        >
          <BarTopProductos data={ordenesPorEstado} />
        </ChartCard>
        <ChartCard
          title="Cuentas por pagar por estado"
          description="Importe acumulado"
        >
          <BarTopProductos data={cxpPorEstado} />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Superficie por rancho"
          description="m² sembrables por unidad"
        >
          <BarTopProductos data={superficiePorRancho} />
        </ChartCard>
        <ChartCard
          title="Plantas producidas por semillero"
          description="Top semilleros"
        >
          <BarTopProductos data={plantasPorSemillero} />
        </ChartCard>
        <ChartCard
          title="Movimientos de inventario"
          description="Entradas vs. salidas (cantidad)"
        >
          <BarTopProductos data={movPorTipo} />
        </ChartCard>
      </section>
    </div>
  )
}
