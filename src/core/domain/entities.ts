/**
 * Domain entities for the Pineapple Agricultural Management System.
 *
 * These types describe the REAL schema of the system. They are completely
 * framework- and persistence-agnostic: nothing here knows about JSON, files,
 * SQL, React or Next.js. Migrating to a real database only requires providing
 * a new implementation of the repository ports (see ./repositories.ts) — these
 * types stay exactly the same.
 */

/** Anything stored in a collection is identifiable by a string id. */
export interface Identifiable {
  id: string
}

/** Common audit metadata kept on every persisted record. */
export interface Auditable {
  createdAt: string
  updatedAt: string
}

export type BaseEntity = Identifiable & Auditable

export type EstadoActivo = "activo" | "inactivo"

/** GeoJSON Polygon (rings of [lng, lat] pairs in degrees). */
export interface GeoPolygon {
  type: "Polygon"
  coordinates: number[][][]
}

/* -------------------------------------------------------------------------- */
/* 1. Estructura productiva                                                   */
/* -------------------------------------------------------------------------- */

export interface Rancho extends BaseEntity {
  nombre: string
  estado: EstadoActivo
}

export interface Parcela extends BaseEntity {
  ranchoId: string
  identificador: string
  superficieM2: number
  estado: EstadoActivo
  esSemillero: boolean
  /** Optional drawn boundary; absent until captured on the map. */
  geometria?: GeoPolygon | null
}

export interface Plantilla extends BaseEntity {
  parcelaId: string
  numero: string
  superficieM2: number
}

/* -------------------------------------------------------------------------- */
/* 2. Ciclos de cultivo                                                       */
/* -------------------------------------------------------------------------- */

export type EstadoCiclo = "planeado" | "activo" | "cosechado" | "cerrado"

export interface Ciclo extends BaseEntity {
  parcelaId: string
  fechaInicio: string
  fechaCosechaEstimada: string
  estado: EstadoCiclo
}

export interface Siembra extends BaseEntity {
  cicloId: string
  plantillaId: string
  fecha: string
  cantidadPlantas: number
  costoUnitarioPlanta: number
}

/* -------------------------------------------------------------------------- */
/* 3. Semilleros                                                              */
/* -------------------------------------------------------------------------- */

export interface Semillero extends BaseEntity {
  parcelaId: string
  fechaProduccion: string
  costoManoObra: number
  costoInsumos: number
  costoMaquinaria: number
  plantasProducidas: number
}

/* -------------------------------------------------------------------------- */
/* 4. Mano de obra                                                            */
/* -------------------------------------------------------------------------- */

export interface Actividad extends BaseEntity {
  nombre: string
  descripcion: string
}

export interface RegistroActividad extends BaseEntity {
  fecha: string
  actividadId: string
  ranchoId: string
  parcelaId: string
  plantillaId: string
  cicloId: string
  responsable: string
  cantidad: number
  costo: number
}

/* -------------------------------------------------------------------------- */
/* 5. Productos e insumos                                                     */
/* -------------------------------------------------------------------------- */

export interface Producto extends BaseEntity {
  ingredienteActivo: string
  nombreComercial: string
  presentacion: string
  unidadMedida: string
}

/* -------------------------------------------------------------------------- */
/* 6. Proveedores                                                             */
/* -------------------------------------------------------------------------- */

export interface Proveedor extends BaseEntity {
  razonSocial: string
  contacto: string
  telefonoPrincipal: string
  telefonoSecundario: string
  whatsapp: string
  email: string
}

/* -------------------------------------------------------------------------- */
/* 7. Inventarios (PEPS)                                                      */
/* -------------------------------------------------------------------------- */

export type TipoMovimiento = "entrada" | "salida"

export interface MovimientoInventario extends BaseEntity {
  productoId: string
  tipo: TipoMovimiento
  fecha: string
  cantidad: number
  costoUnitario: number
  proveedorId: string
  factura: string
  destino: string
}

/* -------------------------------------------------------------------------- */
/* 8. Requerimientos                                                          */
/* -------------------------------------------------------------------------- */

export interface DetalleRequerimiento {
  productoId: string
  cantidad: number
  unidadMedida: string
}

export interface Requerimiento extends BaseEntity {
  folio: string
  fecha: string
  solicitante: string
  observaciones: string
  detalles: DetalleRequerimiento[]
}

/* -------------------------------------------------------------------------- */
/* 9. Cotizaciones                                                            */
/* -------------------------------------------------------------------------- */

export type EstadoCotizacion = "pendiente" | "cotizada" | "comprada"

export interface DetalleCotizacion {
  productoId: string
  cantidad: number
  precioUnitario: number
}

export interface Cotizacion extends BaseEntity {
  requerimientoId: string
  proveedorId: string
  fecha: string
  estado: EstadoCotizacion
  detalles: DetalleCotizacion[]
}

/* -------------------------------------------------------------------------- */
/* 10. Órdenes de compra                                                      */
/* -------------------------------------------------------------------------- */

export type EstadoOrdenCompra =
  | "borrador"
  | "autorizada"
  | "parcial"
  | "surtida"
  | "cancelada"

export interface DetalleOrdenCompra {
  productoId: string
  cantidad: number
  precioUnitario: number
}

export interface OrdenCompra extends BaseEntity {
  folio: string
  fecha: string
  proveedorId: string
  estado: EstadoOrdenCompra
  detalles: DetalleOrdenCompra[]
}

/* -------------------------------------------------------------------------- */
/* 11. Recepción de productos                                                 */
/* -------------------------------------------------------------------------- */

export interface DetalleRecepcion {
  productoId: string
  cantidad: number
  costoUnitario: number
}

export interface Recepcion extends BaseEntity {
  ordenCompraId: string
  factura: string
  fecha: string
  detalles: DetalleRecepcion[]
}

/* -------------------------------------------------------------------------- */
/* 12. Cuentas por pagar                                                      */
/* -------------------------------------------------------------------------- */

export type EstadoCuentaPorPagar = "pendiente" | "pagada" | "vencida"

export interface CuentaPorPagar extends BaseEntity {
  proveedorId: string
  factura: string
  importe: number
  fechaVencimiento: string
  estado: EstadoCuentaPorPagar
}

/* -------------------------------------------------------------------------- */
/* 13. Vales de salida                                                        */
/* -------------------------------------------------------------------------- */

export interface DetalleVale {
  productoId: string
  cantidad: number
  costoUnitario: number
}

export interface ValeSalida extends BaseEntity {
  folio: string
  fecha: string
  responsable: string
  ranchoId: string
  parcelaId: string
  plantillaId: string
  cicloId: string
  detalles: DetalleVale[]
}

/* -------------------------------------------------------------------------- */
/* 14. Tesorería                                                              */
/* -------------------------------------------------------------------------- */

export type TipoCategoria = "ingreso" | "egreso"

export interface Categoria extends BaseEntity {
  nombre: string
  tipo: TipoCategoria
  /** "" = categoría raíz (sin padre). */
  parentId: string
  orden: number
  estado: EstadoActivo
}

export type TipoCuenta = "banco" | "efectivo" | "persona" | "reserva"

export interface Cuenta extends BaseEntity {
  nombre: string
  tipo: TipoCuenta
  moneda: string
  saldoInicial: number
  estado: EstadoActivo
}

export type RolUsuario = "admin" | "persona"

export interface Usuario extends BaseEntity {
  nombre: string
  email: string
  passwordHash: string
  rol: RolUsuario
  estado: EstadoActivo
}

export interface UsuarioCuenta extends BaseEntity {
  usuarioId: string
  cuentaId: string
}

export interface Traspaso extends BaseEntity {
  fecha: string
  cuentaOrigenId: string
  cuentaDestinoId: string
  monto: number
  /** "" = sin referencia. */
  referencia: string
  /** "" = sin autor (import histórico). */
  creadoPor: string
}

export type DireccionMovimiento = "entrada" | "salida"

export interface Movimiento extends BaseEntity {
  cuentaId: string
  fecha: string
  direccion: DireccionMovimiento
  /** "" = movimiento generado por un traspaso (sin categoría propia). */
  categoriaId: string
  monto: number
  beneficiario: string
  referencia: string
  folio: string
  descripcion: string
  /** "" = movimiento normal (no viene de un traspaso). */
  traspasoId: string
  /** "" = sin autor (import histórico). */
  creadoPor: string
}

/**
 * Registry mapping every collection name to its entity type. This is the single
 * source of truth that ties the persistence layer, the application services and
 * the presentation layer together in a type-safe way.
 */
export interface CollectionMap {
  ranchos: Rancho
  parcelas: Parcela
  plantillas: Plantilla
  ciclos: Ciclo
  siembras: Siembra
  semilleros: Semillero
  actividades: Actividad
  registrosActividad: RegistroActividad
  productos: Producto
  proveedores: Proveedor
  movimientosInventario: MovimientoInventario
  requerimientos: Requerimiento
  cotizaciones: Cotizacion
  ordenesCompra: OrdenCompra
  recepciones: Recepcion
  cuentasPorPagar: CuentaPorPagar
  valesSalida: ValeSalida
  categorias: Categoria
  cuentas: Cuenta
  usuarios: Usuario
  usuarioCuentas: UsuarioCuenta
  traspasos: Traspaso
  movimientos: Movimiento
}

export type CollectionName = keyof CollectionMap
