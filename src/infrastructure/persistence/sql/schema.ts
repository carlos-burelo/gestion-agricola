import {
  type AnyPgColumn,
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
export const tipoCategoria = pgEnum("tipo_categoria", ["ingreso", "egreso"])
export const tipoCuenta = pgEnum("tipo_cuenta", [
  "banco",
  "efectivo",
  "persona",
  "reserva",
])
export const titularTipo = pgEnum("titular_tipo", [
  "cliente",
  "proveedor",
  "trabajador",
  "familiar",
  "negocio",
])
export const rolUsuario = pgEnum("rol_usuario", ["admin", "persona"])
export const direccionMovimiento = pgEnum("direccion_movimiento_financiero", [
  "entrada",
  "salida",
])
export const tipoPagoVenta = pgEnum("tipo_pago_venta", ["contado", "cxc"])
export const estadoVenta = pgEnum("estado_venta", ["pagada", "pendiente", "parcial"])
export const estadoAnticipo = pgEnum("estado_anticipo", ["pendiente", "aplicado"])
export const tipoPrestamo = pgEnum("tipo_prestamo", ["bancario", "externo"])
export const estadoPrestamo = pgEnum("estado_prestamo", ["activo", "liquidado"])
export const tipoGastoExterno = pgEnum("tipo_gasto_externo", ["operativo", "administrativo", "familiar"])

// Audit columns
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

// 3. Mano de obra y Trabajadores
export const actividades = pgTable("actividades", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  ...audit,
})

export const trabajadores = pgTable("trabajadores", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  puesto: text("puesto").notNull(),
  salarioBase: doublePrecision("salario_base").notNull(),
  telefono: text("telefono").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const registrosActividad = pgTable("registros_actividad", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  actividadId: text("actividad_id")
    .notNull()
    .references(() => actividades.id),
  trabajadorId: text("trabajador_id").references(() => trabajadores.id),
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

// 4. Productos y Proveedores
export const productos = pgTable("productos", {
  id: text("id").primaryKey(),
  ingredienteActivo: text("ingrediente_activo").notNull(),
  nombreComercial: text("nombre_comercial").notNull(),
  presentacion: text("presentacion").notNull(),
  unidadMedida: text("unidad_medida").notNull(),
  ...audit,
})

export const proveedores = pgTable("proveedores", {
  id: text("id").primaryKey(),
  razonSocial: text("razon_social").notNull(),
  contacto: text("contacto").notNull(),
  telefonoPrincipal: text("telefono_principal").notNull(),
  telefonoSecundario: text("telefono_secundario").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const movimientosInventario = pgTable("movimientos_inventario", {
  id: text("id").primaryKey(),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id),
  tipo: tipoMovimiento("tipo").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  cantidad: doublePrecision("cantidad").notNull(),
  costoUnitario: doublePrecision("costo_unitario").notNull(),
  proveedorId: text("proveedor_id").references(() => proveedores.id),
  factura: text("factura").notNull(),
  destino: text("destino").notNull(),
  ...audit,
})

// 5. Requerimientos, Compras y Vales
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

// 6. Catálogos de Gastos Clasificados y Familiares
export const catGastosOperativos = pgTable("cat_gastos_operativos", {
  id: text("id").primaryKey(),
  concepto: text("concepto").notNull(),
  descripcion: text("descripcion").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const catGastosFinancieros = pgTable("cat_gastos_financieros", {
  id: text("id").primaryKey(),
  concepto: text("concepto").notNull(),
  descripcion: text("descripcion").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const catGastosAdministrativos = pgTable("cat_gastos_administrativos", {
  id: text("id").primaryKey(),
  concepto: text("concepto").notNull(),
  descripcion: text("descripcion").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const catGastosFamilia = pgTable("cat_gastos_familia", {
  id: text("id").primaryKey(),
  concepto: text("concepto").notNull(),
  descripcion: text("descripcion").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const familiares = pgTable("familiares", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  parentesco: text("parentesco").notNull(),
  telefono: text("telefono").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

// 7. Clientes y Ventas
export const clientes = pgTable("clientes", {
  id: text("id").primaryKey(),
  nombreRazonSocial: text("nombre_razon_social").notNull(),
  rfc: text("rfc").notNull(),
  telefono: text("telefono").notNull(),
  email: text("email").notNull(),
  direccion: text("direccion").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const ventasPina = pgTable("ventas_pina", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id")
    .notNull()
    .references(() => clientes.id),
  folioLoteProduccion: text("folio_lote_produccion").notNull(),
  kilosEnviados: doublePrecision("kilos_enviados").notNull(),
  precioPorKg: doublePrecision("precio_por_kg").notNull(),
  montoTotal: doublePrecision("monto_total").notNull(),
  tipoPago: tipoPagoVenta("tipo_pago").notNull(),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  estado: estadoVenta("estado").notNull(),
  ...audit,
})

export const ventasGanado = pgTable("ventas_ganado", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id")
    .notNull()
    .references(() => clientes.id),
  cabezasOKg: doublePrecision("cabezas_o_kg").notNull(),
  precioUnitario: doublePrecision("precio_unitario").notNull(),
  montoTotal: doublePrecision("monto_total").notNull(),
  tipoPago: tipoPagoVenta("tipo_pago").notNull(),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  estado: estadoVenta("estado").notNull(),
  ...audit,
})

export const anticiposClientes = pgTable("anticipos_clientes", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id")
    .notNull()
    .references(() => clientes.id),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  monto: doublePrecision("monto").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  formaPago: text("forma_pago").notNull(),
  folio: text("folio").notNull(),
  estado: estadoAnticipo("estado").notNull(),
  ...audit,
})

export const abonosClientes = pgTable("abonos_clientes", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id")
    .notNull()
    .references(() => clientes.id),
  ventaId: text("venta_id").notNull(),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  monto: doublePrecision("monto").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  folio: text("folio").notNull(),
  ...audit,
})

// 8. Banco, Préstamos y Transferencias Fisclo-Financieras
export const prestamosBancarios = pgTable("prestamos_bancarios", {
  id: text("id").primaryKey(),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  bancoNombre: text("banco_nombre").notNull(),
  folio: text("folio").notNull(),
  montoTotal: doublePrecision("monto_total").notNull(),
  tasaInteres: doublePrecision("tasa_interes").notNull(),
  fechaConcesion: timestamp("fecha_concesion", { withTimezone: true }).notNull(),
  saldoPendiente: doublePrecision("saldo_pendiente").notNull(),
  estado: estadoPrestamo("estado").notNull(),
  ...audit,
})

export const prestamosExternos = pgTable("prestamos_externos", {
  id: text("id").primaryKey(),
  prestamistaNombre: text("prestamista_nombre").notNull(),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  folio: text("folio").notNull(),
  montoTotal: doublePrecision("monto_total").notNull(),
  fechaConcesion: timestamp("fecha_concesion", { withTimezone: true }).notNull(),
  saldoPendiente: doublePrecision("saldo_pendiente").notNull(),
  estado: estadoPrestamo("estado").notNull(),
  ...audit,
})

export const abonosPrestamos = pgTable("abonos_prestamos", {
  id: text("id").primaryKey(),
  tipoPrestamo: tipoPrestamo("tipo_prestamo").notNull(),
  prestamoId: text("prestamo_id").notNull(),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  monto: doublePrecision("monto").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  folio: text("folio").notNull(),
  ...audit,
})

export const transferenciasHijuelos = pgTable("transferencias_hijuelos", {
  id: text("id").primaryKey(),
  cuentaOrigenId: text("cuenta_origen_id").notNull(),
  cuentaDestinoId: text("cuenta_destino_id").notNull(),
  monto: doublePrecision("monto").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  folioFiscal: text("folio_fiscal").notNull(),
  conceptoFiscal: text("concepto_fiscal").notNull(),
  observaciones: text("observaciones").notNull(),
  ...audit,
})

export const cargosComisiones = pgTable("cargos_comisiones", {
  id: text("id").primaryKey(),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  catGastoFinancieroId: text("cat_gasto_financiero_id").notNull(),
  monto: doublePrecision("monto").notNull(),
  folio: text("folio").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  observaciones: text("observaciones").notNull(),
  ...audit,
})

// 9. Otros Gastos (Fuera del core)
export const gastosExternos = pgTable("gastos_externos", {
  id: text("id").primaryKey(),
  tipoGasto: tipoGastoExterno("tipo_gasto").notNull(),
  catGastoId: text("cat_gasto_id").notNull(),
  familiarId: text("familiar_id"),
  bancoCuentaId: text("banco_cuenta_id").notNull(),
  monto: doublePrecision("monto").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  folioFactura: text("folio_factura").notNull(),
  observaciones: text("observaciones").notNull(),
  ...audit,
})

// 10. Tesorería
export const categorias = pgTable("categorias", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipo: tipoCategoria("tipo").notNull(),
  parentId: text("parent_id").references((): AnyPgColumn => categorias.id),
  orden: integer("orden").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const cuentas = pgTable("cuentas", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipo: tipoCuenta("tipo").notNull(),
  titularTipo: titularTipo("titular_tipo"),
  titularNombre: text("titular_nombre"),
  bancoNombre: text("banco_nombre"),
  numeroCuenta: text("numero_cuenta"),
  moneda: text("moneda").notNull(),
  saldoInicial: doublePrecision("saldo_inicial").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rol: rolUsuario("rol").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const usuarioCuentas = pgTable("usuario_cuentas", {
  id: text("id").primaryKey(),
  usuarioId: text("usuario_id")
    .notNull()
    .references(() => usuarios.id),
  cuentaId: text("cuenta_id")
    .notNull()
    .references(() => cuentas.id),
  ...audit,
})

export const traspasos = pgTable("traspasos", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  cuentaOrigenId: text("cuenta_origen_id")
    .notNull()
    .references(() => cuentas.id),
  cuentaDestinoId: text("cuenta_destino_id")
    .notNull()
    .references(() => cuentas.id),
  monto: doublePrecision("monto").notNull(),
  referencia: text("referencia"),
  creadoPor: text("creado_por").references(() => usuarios.id),
  ...audit,
})

export const movimientos = pgTable("movimientos", {
  id: text("id").primaryKey(),
  cuentaId: text("cuenta_id")
    .notNull()
    .references(() => cuentas.id),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  direccion: direccionMovimiento("direccion").notNull(),
  categoriaId: text("categoria_id").references(() => categorias.id),
  monto: doublePrecision("monto").notNull(),
  beneficiario: text("beneficiario"),
  referencia: text("referencia"),
  folio: text("folio"),
  descripcion: text("descripcion"),
  traspasoId: text("traspaso_id").references(() => traspasos.id),
  creadoPor: text("creado_por").references(() => usuarios.id),
  ...audit,
})
