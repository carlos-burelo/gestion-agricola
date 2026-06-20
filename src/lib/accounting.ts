import type { CuentaPorPagar } from "@/core/domain/entities"

export type CxP = CuentaPorPagar
export interface ProveedorRef {
  id: string
  razonSocial: string
}

export interface AgingFila {
  proveedor: string
  porVencer: number
  d1_30: number
  d31_60: number
  d61_90: number
  d90: number
  total: number
}
export interface AgingReporte {
  filas: AgingFila[]
  totales: AgingFila
}

export interface EstadoCuentaReporte {
  proveedor: string
  filas: {
    factura: string
    fecha: string
    vencimiento: string
    importe: number
    estado: string
  }[]
  totales: {
    facturado: number
    pagado: number
    pendiente: number
    vencido: number
  }
}

export interface EgresoMes {
  mes: string
  pagado: number
  pendiente: number
  total: number
}

function diasVencido(fechaVencimiento: string, hoy: Date): number {
  const v = new Date(`${fechaVencimiento}T00:00:00Z`)
  const h = new Date(`${hoy.toISOString().slice(0, 10)}T00:00:00Z`)
  return Math.floor((h.getTime() - v.getTime()) / 86_400_000)
}

const emptyFila = (proveedor: string): AgingFila => ({
  proveedor,
  porVencer: 0,
  d1_30: 0,
  d31_60: 0,
  d61_90: 0,
  d90: 0,
  total: 0,
})

/** Aging buckets over UNPAID accounts, grouped by supplier. */
export function aging(
  cxps: CuentaPorPagar[],
  proveedores: ProveedorRef[],
  hoy: Date,
): AgingReporte {
  const nombre = new Map(proveedores.map((p) => [p.id, p.razonSocial]))
  const map = new Map<string, AgingFila>()
  const totales = emptyFila("Total")

  for (const c of cxps) {
    if (c.estado === "pagada") continue
    const key = c.proveedorId
    let fila = map.get(key)
    if (!fila) {
      fila = emptyFila(nombre.get(key) ?? key)
      map.set(key, fila)
    }
    const d = diasVencido(c.fechaVencimiento, hoy)
    let bucket: "porVencer" | "d1_30" | "d31_60" | "d61_90" | "d90"
    if (d <= 0) bucket = "porVencer"
    else if (d <= 30) bucket = "d1_30"
    else if (d <= 60) bucket = "d31_60"
    else if (d <= 90) bucket = "d61_90"
    else bucket = "d90"
    fila[bucket] += c.importe
    fila.total += c.importe
    totales[bucket] += c.importe
    totales.total += c.importe
  }

  const filas = Array.from(map.values()).sort((a, b) => b.total - a.total)
  return { filas, totales }
}

/** Per-supplier statement with totals split by status. */
export function estadoCuenta(
  cxps: CuentaPorPagar[],
  proveedores: ProveedorRef[],
  proveedorId: string,
): EstadoCuentaReporte {
  const nombre = new Map(proveedores.map((p) => [p.id, p.razonSocial]))
  const rows = cxps
    .filter((c) => c.proveedorId === proveedorId)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
  const totales = { facturado: 0, pagado: 0, pendiente: 0, vencido: 0 }
  const filas = rows.map((c) => {
    totales.facturado += c.importe
    if (c.estado === "pagada") totales.pagado += c.importe
    else if (c.estado === "vencida") totales.vencido += c.importe
    else totales.pendiente += c.importe
    return {
      factura: c.factura,
      fecha: c.createdAt.slice(0, 10),
      vencimiento: c.fechaVencimiento,
      importe: c.importe,
      estado: c.estado,
    }
  })
  return { proveedor: nombre.get(proveedorId) ?? proveedorId, filas, totales }
}

/** Outflows grouped by the month the account was generated (createdAt). */
export function egresosPorMes(cxps: CuentaPorPagar[]): EgresoMes[] {
  const map = new Map<string, EgresoMes>()
  for (const c of cxps) {
    const mes = c.createdAt.slice(0, 7)
    let e = map.get(mes)
    if (!e) {
      e = { mes, pagado: 0, pendiente: 0, total: 0 }
      map.set(mes, e)
    }
    if (c.estado === "pagada") e.pagado += c.importe
    else e.pendiente += c.importe
    e.total += c.importe
  }
  return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes))
}

/** Filters by createdAt date (inclusive, "YYYY-MM-DD"). */
export function filtrarPorFecha(
  cxps: CuentaPorPagar[],
  desde?: string,
  hasta?: string,
): CuentaPorPagar[] {
  return cxps.filter((c) => {
    const d = c.createdAt.slice(0, 10)
    if (desde && d < desde) return false
    if (hasta && d > hasta) return false
    return true
  })
}
