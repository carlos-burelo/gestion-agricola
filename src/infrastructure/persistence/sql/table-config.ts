import type { PgTable } from "drizzle-orm/pg-core"
import * as s from "./schema"

const AUDIT = ["createdAt", "updatedAt"]

export interface FlatConfig {
  table: PgTable
  dateFields: string[]
}
export interface AggConfig {
  table: PgTable
  child: PgTable
  /** columna FK en la tabla hija que apunta al padre (propiedad TS). */
  parentFk: string
  dateFields: string[]
  childDateFields: string[]
}

export const flatConfigs: Record<string, FlatConfig> = {
  ranchos: { table: s.ranchos, dateFields: AUDIT },
  parcelas: { table: s.parcelas, dateFields: AUDIT },
  plantillas: { table: s.plantillas, dateFields: AUDIT },
  ciclos: {
    table: s.ciclos,
    dateFields: ["fechaInicio", "fechaCosechaEstimada", ...AUDIT],
  },
  siembras: { table: s.siembras, dateFields: ["fecha", ...AUDIT] },
  semilleros: { table: s.semilleros, dateFields: ["fechaProduccion", ...AUDIT] },
  actividades: { table: s.actividades, dateFields: AUDIT },
  registrosActividad: {
    table: s.registrosActividad,
    dateFields: ["fecha", ...AUDIT],
  },
  productos: { table: s.productos, dateFields: AUDIT },
  proveedores: { table: s.proveedores, dateFields: AUDIT },
  movimientosInventario: {
    table: s.movimientosInventario,
    dateFields: ["fecha", ...AUDIT],
  },
  cuentasPorPagar: {
    table: s.cuentasPorPagar,
    dateFields: ["fechaVencimiento", ...AUDIT],
  },
}

export const aggConfigs: Record<string, AggConfig> = {
  requerimientos: {
    table: s.requerimientos,
    child: s.detalleRequerimiento,
    parentFk: "requerimientoId",
    dateFields: ["fecha", ...AUDIT],
    childDateFields: [],
  },
  cotizaciones: {
    table: s.cotizaciones,
    child: s.detalleCotizacion,
    parentFk: "cotizacionId",
    dateFields: ["fecha", ...AUDIT],
    childDateFields: [],
  },
  ordenesCompra: {
    table: s.ordenesCompra,
    child: s.detalleOrdenCompra,
    parentFk: "ordenCompraId",
    dateFields: ["fecha", ...AUDIT],
    childDateFields: [],
  },
  recepciones: {
    table: s.recepciones,
    child: s.detalleRecepcion,
    parentFk: "recepcionId",
    dateFields: ["fecha", ...AUDIT],
    childDateFields: [],
  },
  valesSalida: {
    table: s.valesSalida,
    child: s.detalleVale,
    parentFk: "valeSalidaId",
    dateFields: ["fecha", ...AUDIT],
    childDateFields: [],
  },
}

/** Convierte una fila de Drizzle a entidad de dominio (Date → ISO string). */
export function toEntity<T>(
  row: Record<string, unknown>,
  dateFields: string[],
): T {
  const out: Record<string, unknown> = { ...row }
  for (const f of dateFields) {
    const v = out[f]
    if (v instanceof Date) out[f] = v.toISOString()
  }
  return out as T
}

/** Convierte datos de dominio a fila insertable (ISO string → Date). */
export function toRow(
  data: Record<string, unknown>,
  dateFields: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data }
  for (const f of dateFields) {
    const v = out[f]
    if (typeof v === "string") out[f] = new Date(v)
  }
  return out
}
