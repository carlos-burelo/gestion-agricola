import { Boxes, Leaf, MapPin, Sprout } from "lucide-react"
import type { Ciclo } from "@/core/domain/entities"
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
import { PageHeader } from "@/presentation/components/page-header"
import { StatCard } from "@/presentation/components/stat-card"
import { getModuleBySlug } from "@/presentation/config/modules"
import { loadLabelMap, loadRecords } from "@/presentation/queries"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export default async function DashboardHome() {
  const analytics = analyticsService()
  const costing = costingService()
  const [
    ranchos,
    parcelas,
    ciclos,
    existencias,
    costosMes,
    plantasMes,
    mezcla,
    costoRancho,
    ranchoLabels,
  ] = await Promise.all([
    loadRecords("ranchos"),
    loadRecords("parcelas"),
    loadRecords<Ciclo>("ciclos"),
    inventoryService().existencias(),
    analytics.costosPorMes(),
    analytics.plantasPorMes(),
    analytics.mezclaCostos(),
    costing.resumenPorNivel("ranchoId"),
    loadLabelMap(getModuleBySlug("ranchos")!),
  ])

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
        badge="Sistema de gestión agrícola"
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

      <section>
        <ChartCard
          title="Costos por rancho"
          description="Mano de obra vs. insumos acumulados por unidad productiva"
        >
          <BarCosteoNivel rows={costoRancho} labels={ranchoLabels} />
        </ChartCard>
      </section>
    </div>
  )
}
