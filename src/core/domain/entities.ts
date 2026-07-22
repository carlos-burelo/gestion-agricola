/**
 * Domain entities for the Agricultural & Financial Management System.
 *
 * Framework- and persistence-agnostic domain interfaces.
 */

export interface Identifiable {
  id: string
}

export interface Auditable {
  createdAt: string
  updatedAt: string
}

export type BaseEntity = Identifiable & Auditable

export type EstadoActivo = "activo" | "inactivo"

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
  geometria?: GeoPolygon | null
}

export interface Plantilla extends BaseEntity {
  parcelaId: string
  numero: string
  superficieM2: number
}

/* -------------------------------------------------------------------------- */
/* 2. Producción y Ciclos                                                     */
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

export interface Semillero extends BaseEntity {
  parcelaId: string
  fechaProduccion: string
  costoManoObra: number
  costoInsumos: number
  costoMaquinaria: number
  plantasProducidas: number
}

/* -------------------------------------------------------------------------- */
/* 3. Mano de obra y Trabajadores                                             */
/* -------------------------------------------------------------------------- */

export interface Actividad extends BaseEntity {
  nombre: string
  descripcion: string
}

export interface Trabajador extends BaseEntity {
  nombre: string
  puesto: string
  salarioBase: number
  telefono: string
  estado: EstadoActivo
}

export interface RegistroActividad extends BaseEntity {
  fecha: string
  actividadId: string
  trabajadorId?: string
  ranchoId: string
  parcelaId: string
  plantillaId: string
  cicloId: string
  responsable: string
  cantidad: number
  costo: number
}

/* -------------------------------------------------------------------------- */
/* 4. Inventarios, Productos y Proveedores                                    */
/* -------------------------------------------------------------------------- */

export interface Producto extends BaseEntity {
  ingredienteActivo: string
  nombreComercial: string
  presentacion: string
  unidadMedida: string
}

export interface Proveedor extends BaseEntity {
  razonSocial: string
  contacto: string
  telefonoPrincipal: string
  telefonoSecundario: string
  whatsapp: string
  email: string
  estado: EstadoActivo
}

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
/* 5. Requerimientos, Compras y CxP                                            */
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

export type EstadoCuentaPorPagar = "pendiente" | "pagada" | "vencida"

export interface CuentaPorPagar extends BaseEntity {
  proveedorId: string
  factura: string
  importe: number
  fechaVencimiento: string
  estado: EstadoCuentaPorPagar
}

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
/* 6. Catálogos Financieros y de Gastos Clasificados                          */
/* -------------------------------------------------------------------------- */

export interface CatGastoOperativo extends BaseEntity {
  concepto: string
  descripcion: string
  estado: EstadoActivo
}

export interface CatGastoFinanciero extends BaseEntity {
  concepto: string
  descripcion: string
  estado: EstadoActivo
}

export interface CatGastoAdministrativo extends BaseEntity {
  concepto: string
  descripcion: string
  estado: EstadoActivo
}

export interface CatGastoFamilia extends BaseEntity {
  concepto: string
  descripcion: string
  estado: EstadoActivo
}

export interface Familiar extends BaseEntity {
  nombre: string
  parentesco: string
  telefono: string
  estado: EstadoActivo
}

/* -------------------------------------------------------------------------- */
/* 7. Clientes y Ventas (Piña, Ganado, Anticipos)                            */
/* -------------------------------------------------------------------------- */

export interface Cliente extends BaseEntity {
  nombreRazonSocial: string
  rfc: string
  telefono: string
  email: string
  direccion: string
  estado: EstadoActivo
}

export type TipoPagoVenta = "contado" | "cxc"
export type EstadoVenta = "pagada" | "pendiente" | "parcial"

export interface VentaPina extends BaseEntity {
  clienteId: string
  folioLoteProduccion: string
  kilosEnviados: number
  precioPorKg: number
  montoTotal: number
  tipoPago: TipoPagoVenta
  bancoCuentaId: string
  fecha: string
  estado: EstadoVenta
}

export interface VentaGanado extends BaseEntity {
  clienteId: string
  cabezasOKg: number
  precioUnitario: number
  montoTotal: number
  tipoPago: TipoPagoVenta
  bancoCuentaId: string
  fecha: string
  estado: EstadoVenta
}

export type EstadoAnticipo = "pendiente" | "aplicado"

export interface AnticipoCliente extends BaseEntity {
  clienteId: string
  bancoCuentaId: string
  monto: number
  fecha: string
  formaPago: string
  folio: string
  estado: EstadoAnticipo
}

export interface AbonoCliente extends BaseEntity {
  clienteId: string
  ventaId: string
  bancoCuentaId: string
  monto: number
  fecha: string
  folio: string
}

/* -------------------------------------------------------------------------- */
/* 8. Banco, Préstamos y Transferencias Fisclo-Financieras                    */
/* -------------------------------------------------------------------------- */

export type TipoPrestamo = "bancario" | "externo"
export type EstadoPrestamo = "activo" | "liquidado"

export interface PrestamoBancario extends BaseEntity {
  bancoCuentaId: string
  bancoNombre: string
  folio: string
  montoTotal: number
  tasaInteres: number
  fechaConcesion: string
  saldoPendiente: number
  estado: EstadoPrestamo
}

export interface PrestamoExterno extends BaseEntity {
  prestamistaNombre: string
  bancoCuentaId: string
  folio: string
  montoTotal: number
  fechaConcesion: string
  saldoPendiente: number
  estado: EstadoPrestamo
}

export interface AbonoPrestamo extends BaseEntity {
  tipoPrestamo: TipoPrestamo
  prestamoId: string
  bancoCuentaId: string
  monto: number
  fecha: string
  folio: string
}

export interface TransferenciaHijuelos extends BaseEntity {
  cuentaOrigenId: string
  cuentaDestinoId: string
  monto: number
  fecha: string
  folioFiscal: string
  conceptoFiscal: string
  observaciones: string
}

export interface CargoComisionBancaria extends BaseEntity {
  bancoCuentaId: string
  catGastoFinancieroId: string
  monto: number
  folio: string
  fecha: string
  observaciones: string
}

/* -------------------------------------------------------------------------- */
/* 9. Módulo Otros Gastos (Fuera del core agrícola)                            */
/* -------------------------------------------------------------------------- */

export type TipoGastoExterno = "operativo" | "administrativo" | "familiar"

export interface GastoExterno extends BaseEntity {
  tipoGasto: TipoGastoExterno
  catGastoId: string
  familiarId?: string
  bancoCuentaId: string
  monto: number
  fecha: string
  folioFactura: string
  observaciones: string
}

/* -------------------------------------------------------------------------- */
/* 10. Cuentas Bancarias, Usuarios y Tesorería                               */
/* -------------------------------------------------------------------------- */

export type TipoCategoria = "ingreso" | "egreso"

export interface Categoria extends BaseEntity {
  nombre: string
  tipo: TipoCategoria
  parentId: string
  orden: number
  estado: EstadoActivo
}

export type TipoCuenta = "banco" | "efectivo" | "persona" | "reserva"
export type TitularTipo = "cliente" | "proveedor" | "trabajador" | "familiar" | "negocio"

export interface Cuenta extends BaseEntity {
  nombre: string
  tipo: TipoCuenta
  titularTipo?: TitularTipo
  titularNombre?: string
  bancoNombre?: string
  numeroCuenta?: string
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
  referencia: string
  creadoPor: string
}

export type DireccionMovimiento = "entrada" | "salida"

export interface Movimiento extends BaseEntity {
  cuentaId: string
  fecha: string
  direccion: DireccionMovimiento
  categoriaId: string
  monto: number
  beneficiario: string
  referencia: string
  folio: string
  descripcion: string
  traspasoId: string
  creadoPor: string
}

/* -------------------------------------------------------------------------- */
/* Mapping of Collections                                                     */
/* -------------------------------------------------------------------------- */

export interface CollectionMap {
  ranchos: Rancho
  parcelas: Parcela
  plantillas: Plantilla
  ciclos: Ciclo
  siembras: Siembra
  semilleros: Semillero
  actividades: Actividad
  trabajadores: Trabajador
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
  catGastosOperativos: CatGastoOperativo
  catGastosFinancieros: CatGastoFinanciero
  catGastosAdministrativos: CatGastoAdministrativo
  catGastosFamilia: CatGastoFamilia
  familiares: Familiar
  clientes: Cliente
  ventasPina: VentaPina
  ventasGanado: VentaGanado
  anticiposClientes: AnticipoCliente
  abonosClientes: AbonoCliente
  prestamosBancarios: PrestamoBancario
  prestamosExternos: PrestamoExterno
  abonosPrestamos: AbonoPrestamo
  transferenciasHijuelos: TransferenciaHijuelos
  cargosComisiones: CargoComisionBancaria
  gastosExternos: GastoExterno
  categorias: Categoria
  cuentas: Cuenta
  usuarios: Usuario
  usuarioCuentas: UsuarioCuenta
  traspasos: Traspaso
  movimientos: Movimiento
}

export type CollectionName = keyof CollectionMap
