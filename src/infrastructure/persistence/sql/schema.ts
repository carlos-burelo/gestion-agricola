import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import type { GeoPolygon } from "@/core/domain/entities"

// --- Enums ---
export const estadoActivo = pgEnum("estado_activo", ["activo", "inactivo"])
export const estadoCiclo = pgEnum("estado_ciclo", [
  "planeado",
  "activo",
  "cosechado",
  "cerrado",
])
export const estadoCotizacion = pgEnum("estado_cotizacion", [
  "pendiente",
  "cotizada",
  "comprada",
])
export const estadoOrdenCompra = pgEnum("estado_orden_compra", [
  "borrador",
  "autorizada",
  "parcial",
  "surtida",
  "cancelada",
])
export const estadoCuentaPorPagar = pgEnum("estado_cuenta_por_pagar", [
  "pendiente",
  "pagada",
  "vencida",
])
export const tipoMovimiento = pgEnum("tipo_movimiento", ["entrada", "salida"])

// Columnas de auditoría compartidas.
const audit = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}

// 1. Estructura productiva
export const ranchos = pgTable("ranchos", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const parcelas = pgTable("parcelas", {
  id: text("id").primaryKey(),
  ranchoId: text("rancho_id")
    .notNull()
    .references(() => ranchos.id),
  identificador: text("identificador").notNull(),
  superficieM2: doublePrecision("superficie_m2").notNull(),
  estado: estadoActivo("estado").notNull(),
  esSemillero: boolean("es_semillero").notNull(),
  geometria: jsonb("geometria").$type<GeoPolygon | null>(),
  ...audit,
})

export const plantillas = pgTable("plantillas", {
  id: text("id").primaryKey(),
  parcelaId: text("parcela_id")
    .notNull()
    .references(() => parcelas.id),
  numero: text("numero").notNull(),
  superficieM2: doublePrecision("superficie_m2").notNull(),
  ...audit,
})

// 2. Ciclos
export const ciclos = pgTable("ciclos", {
  id: text("id").primaryKey(),
  parcelaId: text("parcela_id")
    .notNull()
    .references(() => parcelas.id),
  fechaInicio: timestamp("fecha_inicio", { withTimezone: true }).notNull(),
  fechaCosechaEstimada: timestamp("fecha_cosecha_estimada", {
    withTimezone: true,
  }).notNull(),
  estado: estadoCiclo("estado").notNull(),
  ...audit,
})

export const siembras = pgTable("siembras", {
  id: text("id").primaryKey(),
  cicloId: text("ciclo_id")
    .notNull()
    .references(() => ciclos.id),
  plantillaId: text("plantilla_id")
    .notNull()
    .references(() => plantillas.id),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  cantidadPlantas: integer("cantidad_plantas").notNull(),
  costoUnitarioPlanta: doublePrecision("costo_unitario_planta").notNull(),
  ...audit,
})

// 3. Semilleros
export const semilleros = pgTable("semilleros", {
  id: text("id").primaryKey(),
  parcelaId: text("parcela_id")
    .notNull()
    .references(() => parcelas.id),
  fechaProduccion: timestamp("fecha_produccion", {
    withTimezone: true,
  }).notNull(),
  costoManoObra: doublePrecision("costo_mano_obra").notNull(),
  costoInsumos: doublePrecision("costo_insumos").notNull(),
  costoMaquinaria: doublePrecision("costo_maquinaria").notNull(),
  plantasProducidas: integer("plantas_producidas").notNull(),
  ...audit,
})

// 4. Mano de obra
export const actividades = pgTable("actividades", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  ...audit,
})

export const registrosActividad = pgTable("registros_actividad", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  actividadId: text("actividad_id")
    .notNull()
    .references(() => actividades.id),
  ranchoId: text("rancho_id")
    .notNull()
    .references(() => ranchos.id),
  parcelaId: text("parcela_id")
    .notNull()
    .references(() => parcelas.id),
  plantillaId: text("plantilla_id")
    .notNull()
    .references(() => plantillas.id),
  cicloId: text("ciclo_id")
    .notNull()
    .references(() => ciclos.id),
  responsable: text("responsable").notNull(),
  cantidad: doublePrecision("cantidad").notNull(),
  costo: doublePrecision("costo").notNull(),
  ...audit,
})

// 5. Productos
export const productos = pgTable("productos", {
  id: text("id").primaryKey(),
  ingredienteActivo: text("ingrediente_activo").notNull(),
  nombreComercial: text("nombre_comercial").notNull(),
  presentacion: text("presentacion").notNull(),
  unidadMedida: text("unidad_medida").notNull(),
  ...audit,
})

// 6. Proveedores
export const proveedores = pgTable("proveedores", {
  id: text("id").primaryKey(),
  razonSocial: text("razon_social").notNull(),
  contacto: text("contacto").notNull(),
  telefonoPrincipal: text("telefono_principal").notNull(),
  telefonoSecundario: text("telefono_secundario").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  ...audit,
})

// 7. Inventario
export const movimientosInventario = pgTable("movimientos_inventario", {
  id: text("id").primaryKey(),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  tipo: tipoMovimiento("tipo").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  cantidad: doublePrecision("cantidad").notNull(),
  costoUnitario: doublePrecision("costo_unitario").notNull(),
  proveedorId: text("proveedor_id")
    .notNull()
    .references(() => proveedores.id),
  factura: text("factura").notNull(),
  destino: text("destino").notNull(),
  ...audit,
})

// 8. Requerimientos (+ líneas)
export const requerimientos = pgTable("requerimientos", {
  id: text("id").primaryKey(),
  folio: text("folio").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  solicitante: text("solicitante").notNull(),
  observaciones: text("observaciones").notNull(),
  ...audit,
})
export const detalleRequerimiento = pgTable("detalle_requerimiento", {
  id: serial("id").primaryKey(),
  requerimientoId: text("requerimiento_id")
    .notNull()
    .references(() => requerimientos.id, { onDelete: "cascade" }),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  unidadMedida: text("unidad_medida").notNull(),
})

// 9. Cotizaciones (+ líneas)
export const cotizaciones = pgTable("cotizaciones", {
  id: text("id").primaryKey(),
  requerimientoId: text("requerimiento_id")
    .notNull()
    .references(() => requerimientos.id),
  proveedorId: text("proveedor_id")
    .notNull()
    .references(() => proveedores.id),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  estado: estadoCotizacion("estado").notNull(),
  ...audit,
})
export const detalleCotizacion = pgTable("detalle_cotizacion", {
  id: serial("id").primaryKey(),
  cotizacionId: text("cotizacion_id")
    .notNull()
    .references(() => cotizaciones.id, { onDelete: "cascade" }),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  precioUnitario: doublePrecision("precio_unitario").notNull(),
})

// 10. Órdenes de compra (+ líneas)
export const ordenesCompra = pgTable("ordenes_compra", {
  id: text("id").primaryKey(),
  folio: text("folio").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  proveedorId: text("proveedor_id")
    .notNull()
    .references(() => proveedores.id),
  estado: estadoOrdenCompra("estado").notNull(),
  ...audit,
})
export const detalleOrdenCompra = pgTable("detalle_orden_compra", {
  id: serial("id").primaryKey(),
  ordenCompraId: text("orden_compra_id")
    .notNull()
    .references(() => ordenesCompra.id, { onDelete: "cascade" }),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  precioUnitario: doublePrecision("precio_unitario").notNull(),
})

// 11. Recepciones (+ líneas)
export const recepciones = pgTable("recepciones", {
  id: text("id").primaryKey(),
  ordenCompraId: text("orden_compra_id")
    .notNull()
    .references(() => ordenesCompra.id),
  factura: text("factura").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  ...audit,
})
export const detalleRecepcion = pgTable("detalle_recepcion", {
  id: serial("id").primaryKey(),
  recepcionId: text("recepcion_id")
    .notNull()
    .references(() => recepciones.id, { onDelete: "cascade" }),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  costoUnitario: doublePrecision("costo_unitario").notNull(),
})

// 12. Cuentas por pagar
export const cuentasPorPagar = pgTable("cuentas_por_pagar", {
  id: text("id").primaryKey(),
  proveedorId: text("proveedor_id")
    .notNull()
    .references(() => proveedores.id),
  factura: text("factura").notNull(),
  importe: doublePrecision("importe").notNull(),
  fechaVencimiento: timestamp("fecha_vencimiento", {
    withTimezone: true,
  }).notNull(),
  estado: estadoCuentaPorPagar("estado").notNull(),
  ...audit,
})

// 13. Vales de salida (+ líneas)
export const valesSalida = pgTable("vales_salida", {
  id: text("id").primaryKey(),
  folio: text("folio").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  responsable: text("responsable").notNull(),
  ranchoId: text("rancho_id")
    .notNull()
    .references(() => ranchos.id),
  parcelaId: text("parcela_id")
    .notNull()
    .references(() => parcelas.id),
  plantillaId: text("plantilla_id")
    .notNull()
    .references(() => plantillas.id),
  cicloId: text("ciclo_id")
    .notNull()
    .references(() => ciclos.id),
  ...audit,
})
export const detalleVale = pgTable("detalle_vale", {
  id: serial("id").primaryKey(),
  valeSalidaId: text("vale_salida_id")
    .notNull()
    .references(() => valesSalida.id, { onDelete: "cascade" }),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  costoUnitario: doublePrecision("costo_unitario").notNull(),
})
