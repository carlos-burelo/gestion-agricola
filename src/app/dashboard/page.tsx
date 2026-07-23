import { redirect } from "next/navigation"
import type {
  Ciclo,
  Cuenta,
  CuentaPorPagar,
  GastoExterno,
  MovimientoInventario,
  OrdenCompra,
  Parcela,
  Producto,
  Rancho,
  Semillero,
  Trabajador,
  ValeSalida,
} from "@/core/domain/entities"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import {
  analyticsService,
  costingService,
  inventoryService,
  repository,
  tesoreriaService,
} from "@/infrastructure/container"
import { RoleDashboardView } from "@/presentation/components/role-dashboard-view"
import { loadRecords } from "@/presentation/queries"

export const dynamic = "force-dynamic"

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const labelsOf = <T extends { id: string }>(
  rows: T[],
  pick: (r: T) => string,
): Record<string, string> => Object.fromEntries(rows.map((r) => [r.id, pick(r)]))

export default async function DashboardHome() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const analytics = analyticsService()
  const costing = costingService()
  const tesoreria = tesoreriaService()

  const [
    ranchos,
    parcelas,
    ciclos,
    semilleros,
    cuentasPorPagar,
    cuentasBancarias,
    gastosExternos,
    trabajadores,
    productos,
    valesSalida,
    ordenes,
    movimientos,
    existencias,
    saldosCuentas,
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
    loadRecords<Cuenta>("cuentas"),
    loadRecords<GastoExterno>("gastosExternos"),
    loadRecords<Trabajador>("trabajadores"),
    loadRecords<Producto>("productos"),
    loadRecords<ValeSalida>("valesSalida"),
    loadRecords<OrdenCompra>("ordenesCompra"),
    loadRecords<MovimientoInventario>("movimientosInventario"),
    inventoryService().existencias(),
    tesoreria.saldosDeTodasLasCuentas(),
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

  const saldoBancarioTotal = Object.values(saldosCuentas).reduce((a, b) => a + b, 0)
  const cxpPendientesMonto = cuentasPorPagar
    .filter((c) => c.estado === "pendiente" || c.estado === "vencida")
    .reduce((a, c) => a + c.importe, 0)

  const totalGastosMes = gastosExternos.reduce((a, g) => a + g.monto, 0)
  const ordenesCompraProceso = ordenes.filter((o) => o.estado !== "cancelada" && o.estado !== "surtida").length

  const topProductos = [...existencias]
    .sort((a, b) => b.valorInventario - a.valorInventario)
    .slice(0, 6)
    .map((e) => ({
      nombre: e.producto.nombreComercial,
      valor: Math.round(e.valorInventario),
    }))

  // Radar: mano de obra vs insumos por rancho
  const costoRadar = costoRancho.map((r) => ({
    rancho: (ranchoLabels[r.clave] ?? r.clave).replace(/^Rancho\s+/i, ""),
    manoObra: Math.round(r.manoObra),
    insumos: Math.round(r.insumos),
  }))

  // Distribuciones por estado
  const ciclosPorEstado = (
    ["planeado", "activo", "cosechado", "cerrado"] as const
  )
    .map((e) => ({ nombre: cap(e), valor: ciclos.filter((c) => c.estado === e).length }))
    .filter((x) => x.valor > 0)

  const cxpPorEstado = (["pendiente", "pagada", "vencida"] as const)
    .map((e) => ({
      nombre: cap(e),
      valor: Math.round(
        cuentasPorPagar.filter((c) => c.estado === e).reduce((a, c) => a + c.importe, 0),
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

  return (
    <RoleDashboardView
      data={{
        userRole: actor.rol,
        userName: actor.nombre || "Usuario MGZ",
        totalRanchos: ranchos.length,
        totalParcelas: parcelas.length,
        ciclosActivos,
        valorInventario,
        totalCuentasBancarias: cuentasBancarias.length,
        saldoBancarioTotal,
        totalCxp: cuentasPorPagar.length,
        cxpPendientesMonto,
        totalGastosMes,
        totalTrabajadores: trabajadores.length,
        totalProductos: productos.length,
        ordenesCompraProceso,
        valesSalidaMes: valesSalida.length,
        topProductos,
        costosMes,
        plantasMes,
        mezcla,
        costoRancho,
        costoParcela,
        costoCiclo,
        costoRadar,
        ciclosPorEstado,
        cxpPorEstado,
        ordenesPorEstado,
        superficiePorRancho,
        plantasPorSemillero,
        movPorTipo,
        ranchoLabels,
        parcelaLabels,
        cicloLabels,
      }}
    />
  )
}
