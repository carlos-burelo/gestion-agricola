import "server-only"
import type { KardexRow } from "@/core/application/inventory-service"
import type { NivelCosteo } from "@/core/application/costing-service"
import type {
  Ciclo,
  CuentaPorPagar,
  OrdenCompra,
  Parcela,
  Plantilla,
  Producto,
  Proveedor,
  Rancho,
  Semillero,
  Siembra,
} from "@/core/domain/entities"
import {
  costingService,
  inventoryService,
  repository,
} from "@/infrastructure/container"
import type { ProveedorRef } from "@/lib/accounting"

export interface InventarioFila {
  producto: string
  existencia: number
  costoPromedio: number
  valorInventario: number
}

export interface CosteoNivel {
  nivel: NivelCosteo
  titulo: string
  filas: {
    concepto: string
    manoObra: number
    insumos: number
    total: number
  }[]
}

export interface SemilleroFila {
  semillero: string
  costoTotal: number
  plantas: number
  costoUnitario: number
}

export interface KardexProducto {
  productoId: string
  producto: string
  filas: KardexRow[]
}

export interface OrdenFila {
  folio: string
  fecha: string
  proveedor: string
  estado: string
  total: number
}

export interface ProduccionMes {
  mes: string
  sembradas: number
  producidas: number
}

export interface ReportesContext {
  cxps: CuentaPorPagar[]
  proveedores: ProveedorRef[]
  inventario: InventarioFila[]
  costeo: CosteoNivel[]
  semilleros: SemilleroFila[]
  kardex: KardexProducto[]
  ordenes: OrdenFila[]
  produccion: ProduccionMes[]
}

const NIVELES: { nivel: NivelCosteo; titulo: string }[] = [
  { nivel: "ranchoId", titulo: "Por rancho" },
  { nivel: "parcelaId", titulo: "Por parcela" },
  { nivel: "plantillaId", titulo: "Por plantilla" },
  { nivel: "cicloId", titulo: "Por ciclo" },
]

export async function loadReportesContext(): Promise<ReportesContext> {
  const costing = costingService()
  const inventory = inventoryService()

  const [
    cxps,
    proveedoresRaw,
    existencias,
    ranchos,
    parcelas,
    plantillas,
    ciclos,
    semillerosRaw,
    productos,
    ordenesRaw,
    siembras,
    resumenes,
    costosSemilla,
  ] = await Promise.all([
    repository<CuentaPorPagar>("cuentasPorPagar").findAll(),
    repository<Proveedor>("proveedores").findAll(),
    inventory.existencias(),
    repository<Rancho>("ranchos").findAll(),
    repository<Parcela>("parcelas").findAll(),
    repository<Plantilla>("plantillas").findAll(),
    repository<Ciclo>("ciclos").findAll(),
    repository<Semillero>("semilleros").findAll(),
    repository<Producto>("productos").findAll(),
    repository<OrdenCompra>("ordenesCompra").findAll(),
    repository<Siembra>("siembras").findAll(),
    Promise.all(NIVELES.map((n) => costing.resumenPorNivel(n.nivel))),
    costing.costoSemilla(),
  ])

  // id -> human label across the four costing levels.
  const labels = new Map<string, string>()
  for (const r of ranchos) labels.set(r.id, r.nombre)
  for (const p of parcelas) labels.set(p.id, p.identificador)
  for (const t of plantillas) labels.set(t.id, `T-${t.numero}`)
  for (const c of ciclos) labels.set(c.id, `Ciclo ${c.fechaInicio}`)

  const proveedorNombre = new Map(
    proveedoresRaw.map((p) => [p.id, p.razonSocial]),
  )
  const parcelaDeSemillero = new Map(
    semillerosRaw.map((s) => [s.id, s.parcelaId]),
  )

  const costeo: CosteoNivel[] = NIVELES.map((n, i) => ({
    nivel: n.nivel,
    titulo: n.titulo,
    filas: resumenes[i].map((r) => ({
      concepto: labels.get(r.clave) ?? r.clave,
      manoObra: r.manoObra,
      insumos: r.insumos,
      total: r.total,
    })),
  }))

  const semilleros: SemilleroFila[] = costosSemilla.map((c) => {
    const parcelaId = parcelaDeSemillero.get(c.semilleroId)
    const label = parcelaId ? (labels.get(parcelaId) ?? parcelaId) : c.semilleroId
    return {
      semillero: label,
      costoTotal: c.costoTotal,
      plantas: c.plantasProducidas,
      costoUnitario: c.costoUnitario,
    }
  })

  const kardex: KardexProducto[] = await Promise.all(
    productos.map(async (p) => ({
      productoId: p.id,
      producto: p.nombreComercial,
      filas: await inventory.kardex(p.id),
    })),
  )

  const ordenes: OrdenFila[] = ordenesRaw.map((o) => ({
    folio: o.folio,
    fecha: o.fecha,
    proveedor: proveedorNombre.get(o.proveedorId) ?? "—",
    estado: o.estado,
    total: o.detalles.reduce(
      (a, d) => a + d.cantidad * d.precioUnitario,
      0,
    ),
  }))

  // Production by month: planted (siembras) vs produced (semilleros).
  const prod = new Map<string, ProduccionMes>()
  const bucket = (mes: string) => {
    let e = prod.get(mes)
    if (!e) {
      e = { mes, sembradas: 0, producidas: 0 }
      prod.set(mes, e)
    }
    return e
  }
  for (const s of siembras) bucket(s.fecha.slice(0, 7)).sembradas += s.cantidadPlantas
  for (const s of semillerosRaw)
    bucket(s.fechaProduccion.slice(0, 7)).producidas += s.plantasProducidas
  const produccion = Array.from(prod.values()).sort((a, b) =>
    a.mes.localeCompare(b.mes),
  )

  return {
    cxps,
    proveedores: proveedoresRaw.map((p) => ({
      id: p.id,
      razonSocial: p.razonSocial,
    })),
    inventario: existencias.map((e) => ({
      producto: e.producto.nombreComercial,
      existencia: e.existencia,
      costoPromedio: e.costoPromedio,
      valorInventario: e.valorInventario,
    })),
    costeo,
    semilleros,
    kardex,
    ordenes,
    produccion,
  }
}
