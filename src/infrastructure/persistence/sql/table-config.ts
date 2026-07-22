import type { PgTable } from "drizzle-orm/pg-core"
import * as s from "./schema"

const AUDIT = ["createdAt", "updatedAt"]

export interface FlatConfig {
  table: PgTable
  dateFields: string[]
  nullableFields?: string[]
}
export interface AggConfig {
  table: PgTable
  child: PgTable
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
  trabajadores: { table: s.trabajadores, dateFields: AUDIT },
  registrosActividad: {
    table: s.registrosActividad,
    dateFields: ["fecha", ...AUDIT],
    nullableFields: ["trabajadorId"],
  },
  productos: { table: s.productos, dateFields: AUDIT },
  proveedores: { table: s.proveedores, dateFields: AUDIT },
  movimientosInventario: {
    table: s.movimientosInventario,
    dateFields: ["fecha", ...AUDIT],
    nullableFields: ["proveedorId"],
  },
  cuentasPorPagar: {
    table: s.cuentasPorPagar,
    dateFields: ["fechaVencimiento", ...AUDIT],
  },
  catGastosOperativos: { table: s.catGastosOperativos, dateFields: AUDIT },
  catGastosFinancieros: { table: s.catGastosFinancieros, dateFields: AUDIT },
  catGastosAdministrativos: { table: s.catGastosAdministrativos, dateFields: AUDIT },
  catGastosFamilia: { table: s.catGastosFamilia, dateFields: AUDIT },
  familiares: { table: s.familiares, dateFields: AUDIT },
  clientes: { table: s.clientes, dateFields: AUDIT },
  ventasPina: { table: s.ventasPina, dateFields: ["fecha", ...AUDIT] },
  ventasGanado: { table: s.ventasGanado, dateFields: ["fecha", ...AUDIT] },
  anticiposClientes: { table: s.anticiposClientes, dateFields: ["fecha", ...AUDIT] },
  abonosClientes: { table: s.abonosClientes, dateFields: ["fecha", ...AUDIT] },
  prestamosBancarios: { table: s.prestamosBancarios, dateFields: ["fechaConcesion", ...AUDIT] },
  prestamosExternos: { table: s.prestamosExternos, dateFields: ["fechaConcesion", ...AUDIT] },
  abonosPrestamos: { table: s.abonosPrestamos, dateFields: ["fecha", ...AUDIT] },
  transferenciasHijuelos: { table: s.transferenciasHijuelos, dateFields: ["fecha", ...AUDIT] },
  cargosComisiones: { table: s.cargosComisiones, dateFields: ["fecha", ...AUDIT] },
  gastosExternos: {
    table: s.gastosExternos,
    dateFields: ["fecha", ...AUDIT],
    nullableFields: ["familiarId"],
  },
  categorias: {
    table: s.categorias,
    dateFields: AUDIT,
    nullableFields: ["parentId"],
  },
  cuentas: {
    table: s.cuentas,
    dateFields: AUDIT,
    nullableFields: ["titularTipo", "titularNombre", "bancoNombre", "numeroCuenta"],
  },
  usuarios: { table: s.usuarios, dateFields: AUDIT },
  usuarioCuentas: { table: s.usuarioCuentas, dateFields: AUDIT },
  traspasos: {
    table: s.traspasos,
    dateFields: ["fecha", ...AUDIT],
    nullableFields: ["referencia", "creadoPor"],
  },
  movimientos: {
    table: s.movimientos,
    dateFields: ["fecha", ...AUDIT],
    nullableFields: [
      "categoriaId",
      "beneficiario",
      "referencia",
      "folio",
      "descripcion",
      "traspasoId",
      "creadoPor",
    ],
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

export function toEntity<T>(
  row: Record<string, unknown>,
  dateFields: string[],
  nullableFields: string[] = [],
): T {
  const out: Record<string, unknown> = { ...row }
  for (const f of dateFields) {
    const v = out[f]
    if (v instanceof Date) out[f] = v.toISOString()
  }
  for (const f of nullableFields) {
    if (out[f] === null || out[f] === undefined) out[f] = ""
  }
  return out as T
}

export function toRow(
  data: Record<string, unknown>,
  dateFields: string[],
  nullableFields: string[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data }
  for (const f of dateFields) {
    const v = out[f]
    if (typeof v === "string") out[f] = new Date(v)
  }
  for (const f of nullableFields) {
    if (out[f] === "") out[f] = null
  }
  return out
}
