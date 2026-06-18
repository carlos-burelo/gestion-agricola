import type { CollectionName } from "@/core/domain/entities"

/**
 * Declarative metadata that drives the entire presentation layer. Each module
 * describes its fields once; the generic table, form and server actions all
 * read from here. Adding a column or a new module is a data change, not a code
 * change (Open/Closed Principle).
 */

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "date"
  | "select"
  | "reference"
  | "json"

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  /** Static options for `select` fields. */
  options?: { value: string; label: string }[]
  /** Target collection + label field for `reference` fields. */
  reference?: { collection: CollectionName; labelField: string }
  /** Hide from the table view (still editable in the form). */
  hideInTable?: boolean
  required?: boolean
  helper?: string
}

export interface ModuleConfig {
  /** URL slug under /dashboard. */
  slug: string
  collection: CollectionName
  title: string
  singular: string
  description: string
  group: string
  fields: FieldConfig[]
}

const estadoActivo: FieldConfig["options"] = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
]

export const MODULES: ModuleConfig[] = [
  {
    slug: "ranchos",
    collection: "ranchos",
    title: "Ranchos",
    singular: "Rancho",
    description: "Unidades productivas de mayor nivel.",
    group: "Estructura productiva",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "parcelas",
    collection: "parcelas",
    title: "Parcelas (Lotes)",
    singular: "Parcela",
    description: "Lotes que pertenecen a un rancho.",
    group: "Estructura productiva",
    fields: [
      {
        name: "ranchoId",
        label: "Rancho",
        type: "reference",
        reference: { collection: "ranchos", labelField: "nombre" },
        required: true,
      },
      { name: "identificador", label: "Identificador", type: "text", required: true },
      { name: "superficieM2", label: "Superficie (m²)", type: "number" },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
      {
        name: "esSemillero",
        label: "¿Es semillero?",
        type: "select",
        options: [
          { value: "true", label: "Sí" },
          { value: "false", label: "No" },
        ],
      },
    ],
  },
  {
    slug: "plantillas",
    collection: "plantillas",
    title: "Plantillas (Tablas)",
    singular: "Plantilla",
    description: "Subdivisiones de una parcela.",
    group: "Estructura productiva",
    fields: [
      {
        name: "parcelaId",
        label: "Parcela",
        type: "reference",
        reference: { collection: "parcelas", labelField: "identificador" },
        required: true,
      },
      { name: "numero", label: "Número", type: "text", required: true },
      { name: "superficieM2", label: "Superficie (m²)", type: "number" },
    ],
  },
  {
    slug: "ciclos",
    collection: "ciclos",
    title: "Ciclos de cultivo",
    singular: "Ciclo",
    description: "Proceso completo de preparación a cosecha.",
    group: "Producción",
    fields: [
      {
        name: "parcelaId",
        label: "Parcela",
        type: "reference",
        reference: { collection: "parcelas", labelField: "identificador" },
        required: true,
      },
      { name: "fechaInicio", label: "Fecha de inicio", type: "date" },
      { name: "fechaCosechaEstimada", label: "Cosecha estimada", type: "date" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "planeado", label: "Planeado" },
          { value: "activo", label: "Activo" },
          { value: "cosechado", label: "Cosechado" },
          { value: "cerrado", label: "Cerrado" },
        ],
      },
    ],
  },
  {
    slug: "siembras",
    collection: "siembras",
    title: "Siembras",
    singular: "Siembra",
    description: "Plantas sembradas por plantilla.",
    group: "Producción",
    fields: [
      {
        name: "cicloId",
        label: "Ciclo",
        type: "reference",
        reference: { collection: "ciclos", labelField: "id" },
        required: true,
      },
      {
        name: "plantillaId",
        label: "Plantilla",
        type: "reference",
        reference: { collection: "plantillas", labelField: "numero" },
        required: true,
      },
      { name: "fecha", label: "Fecha", type: "date" },
      { name: "cantidadPlantas", label: "Plantas sembradas", type: "number" },
      { name: "costoUnitarioPlanta", label: "Costo unitario planta", type: "number" },
    ],
  },
  {
    slug: "semilleros",
    collection: "semilleros",
    title: "Semilleros",
    singular: "Semillero",
    description: "Producción de plantas y su costeo.",
    group: "Producción",
    fields: [
      {
        name: "parcelaId",
        label: "Parcela",
        type: "reference",
        reference: { collection: "parcelas", labelField: "identificador" },
        required: true,
      },
      { name: "fechaProduccion", label: "Fecha de producción", type: "date" },
      { name: "costoManoObra", label: "Costo mano de obra", type: "number" },
      { name: "costoInsumos", label: "Costo insumos", type: "number" },
      { name: "costoMaquinaria", label: "Costo maquinaria", type: "number" },
      { name: "plantasProducidas", label: "Plantas producidas", type: "number" },
    ],
  },
  {
    slug: "actividades",
    collection: "actividades",
    title: "Catálogo de actividades",
    singular: "Actividad",
    description: "Actividades de mano de obra.",
    group: "Mano de obra",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "textarea" },
    ],
  },
  {
    slug: "registros-actividad",
    collection: "registrosActividad",
    title: "Registro de actividades",
    singular: "Registro",
    description: "Mano de obra ejecutada en campo.",
    group: "Mano de obra",
    fields: [
      { name: "fecha", label: "Fecha", type: "date" },
      {
        name: "actividadId",
        label: "Actividad",
        type: "reference",
        reference: { collection: "actividades", labelField: "nombre" },
        required: true,
      },
      {
        name: "ranchoId",
        label: "Rancho",
        type: "reference",
        reference: { collection: "ranchos", labelField: "nombre" },
      },
      {
        name: "parcelaId",
        label: "Parcela",
        type: "reference",
        reference: { collection: "parcelas", labelField: "identificador" },
      },
      {
        name: "plantillaId",
        label: "Plantilla",
        type: "reference",
        reference: { collection: "plantillas", labelField: "numero" },
      },
      {
        name: "cicloId",
        label: "Ciclo",
        type: "reference",
        reference: { collection: "ciclos", labelField: "id" },
      },
      { name: "responsable", label: "Responsable", type: "text" },
      { name: "cantidad", label: "Cantidad", type: "number" },
      { name: "costo", label: "Costo", type: "number" },
    ],
  },
  {
    slug: "productos",
    collection: "productos",
    title: "Productos e insumos",
    singular: "Producto",
    description: "Catálogo de productos.",
    group: "Compras e inventario",
    fields: [
      { name: "ingredienteActivo", label: "Ingrediente activo", type: "text" },
      { name: "nombreComercial", label: "Nombre comercial", type: "text", required: true },
      { name: "presentacion", label: "Presentación", type: "text" },
      { name: "unidadMedida", label: "Unidad de medida", type: "text" },
    ],
  },
  {
    slug: "proveedores",
    collection: "proveedores",
    title: "Proveedores",
    singular: "Proveedor",
    description: "Catálogo de proveedores.",
    group: "Compras e inventario",
    fields: [
      { name: "razonSocial", label: "Razón social", type: "text", required: true },
      { name: "contacto", label: "Contacto", type: "text" },
      { name: "telefonoPrincipal", label: "Tel. principal", type: "text" },
      { name: "telefonoSecundario", label: "Tel. secundario", type: "text", hideInTable: true },
      { name: "whatsapp", label: "WhatsApp", type: "text", hideInTable: true },
      { name: "email", label: "Correo", type: "text" },
    ],
  },
  {
    slug: "movimientos",
    collection: "movimientosInventario",
    title: "Movimientos de inventario",
    singular: "Movimiento",
    description: "Entradas y salidas de almacén (PEPS).",
    group: "Compras e inventario",
    fields: [
      {
        name: "productoId",
        label: "Producto",
        type: "reference",
        reference: { collection: "productos", labelField: "nombreComercial" },
        required: true,
      },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        options: [
          { value: "entrada", label: "Entrada" },
          { value: "salida", label: "Salida" },
        ],
      },
      { name: "fecha", label: "Fecha", type: "date" },
      { name: "cantidad", label: "Cantidad", type: "number" },
      { name: "costoUnitario", label: "Costo unitario", type: "number" },
      {
        name: "proveedorId",
        label: "Proveedor",
        type: "reference",
        reference: { collection: "proveedores", labelField: "razonSocial" },
        hideInTable: true,
      },
      { name: "factura", label: "Factura", type: "text", hideInTable: true },
      { name: "destino", label: "Destino", type: "text", hideInTable: true },
    ],
  },
  {
    slug: "requerimientos",
    collection: "requerimientos",
    title: "Requerimientos",
    singular: "Requerimiento",
    description: "Solicitudes de materiales.",
    group: "Compras e inventario",
    fields: [
      { name: "folio", label: "Folio", type: "text", required: true },
      { name: "fecha", label: "Fecha", type: "date" },
      { name: "solicitante", label: "Solicitante", type: "text" },
      { name: "observaciones", label: "Observaciones", type: "textarea", hideInTable: true },
      {
        name: "detalles",
        label: "Detalles (JSON)",
        type: "json",
        hideInTable: true,
        helper: 'Arreglo de { "productoId", "cantidad", "unidadMedida" }',
      },
    ],
  },
  {
    slug: "cotizaciones",
    collection: "cotizaciones",
    title: "Cotizaciones",
    singular: "Cotización",
    description: "Cotizaciones asociadas a requerimientos.",
    group: "Compras e inventario",
    fields: [
      {
        name: "requerimientoId",
        label: "Requerimiento",
        type: "reference",
        reference: { collection: "requerimientos", labelField: "folio" },
        required: true,
      },
      {
        name: "proveedorId",
        label: "Proveedor",
        type: "reference",
        reference: { collection: "proveedores", labelField: "razonSocial" },
      },
      { name: "fecha", label: "Fecha", type: "date" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "pendiente", label: "Pendiente" },
          { value: "cotizada", label: "Cotizada" },
          { value: "comprada", label: "Comprada" },
        ],
      },
      {
        name: "detalles",
        label: "Detalles (JSON)",
        type: "json",
        hideInTable: true,
        helper: 'Arreglo de { "productoId", "cantidad", "precioUnitario" }',
      },
    ],
  },
  {
    slug: "ordenes-compra",
    collection: "ordenesCompra",
    title: "Órdenes de compra",
    singular: "Orden de compra",
    description: "Órdenes generadas a proveedores.",
    group: "Compras e inventario",
    fields: [
      { name: "folio", label: "Folio", type: "text", required: true },
      { name: "fecha", label: "Fecha", type: "date" },
      {
        name: "proveedorId",
        label: "Proveedor",
        type: "reference",
        reference: { collection: "proveedores", labelField: "razonSocial" },
      },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "borrador", label: "Borrador" },
          { value: "autorizada", label: "Autorizada" },
          { value: "parcial", label: "Parcialmente surtida" },
          { value: "surtida", label: "Surtida" },
          { value: "cancelada", label: "Cancelada" },
        ],
      },
      {
        name: "detalles",
        label: "Detalles (JSON)",
        type: "json",
        hideInTable: true,
        helper: 'Arreglo de { "productoId", "cantidad", "precioUnitario" }',
      },
    ],
  },
  {
    slug: "recepciones",
    collection: "recepciones",
    title: "Recepción de productos",
    singular: "Recepción",
    description: "Recepción contra orden de compra.",
    group: "Compras e inventario",
    fields: [
      {
        name: "ordenCompraId",
        label: "Orden de compra",
        type: "reference",
        reference: { collection: "ordenesCompra", labelField: "folio" },
        required: true,
      },
      { name: "factura", label: "Factura", type: "text" },
      { name: "fecha", label: "Fecha", type: "date" },
      {
        name: "detalles",
        label: "Detalles (JSON)",
        type: "json",
        hideInTable: true,
        helper: 'Arreglo de { "productoId", "cantidad", "costoUnitario" }',
      },
    ],
  },
  {
    slug: "cuentas-por-pagar",
    collection: "cuentasPorPagar",
    title: "Cuentas por pagar",
    singular: "Cuenta por pagar",
    description: "Obligaciones con proveedores.",
    group: "Compras e inventario",
    fields: [
      {
        name: "proveedorId",
        label: "Proveedor",
        type: "reference",
        reference: { collection: "proveedores", labelField: "razonSocial" },
        required: true,
      },
      { name: "factura", label: "Factura", type: "text" },
      { name: "importe", label: "Importe", type: "number" },
      { name: "fechaVencimiento", label: "Vencimiento", type: "date" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "pendiente", label: "Pendiente" },
          { value: "pagada", label: "Pagada" },
          { value: "vencida", label: "Vencida" },
        ],
      },
    ],
  },
  {
    slug: "vales-salida",
    collection: "valesSalida",
    title: "Vales de salida",
    singular: "Vale de salida",
    description: "Salidas de almacén imputadas a campo.",
    group: "Compras e inventario",
    fields: [
      { name: "folio", label: "Folio", type: "text", required: true },
      { name: "fecha", label: "Fecha", type: "date" },
      { name: "responsable", label: "Responsable", type: "text" },
      {
        name: "ranchoId",
        label: "Rancho",
        type: "reference",
        reference: { collection: "ranchos", labelField: "nombre" },
      },
      {
        name: "parcelaId",
        label: "Parcela",
        type: "reference",
        reference: { collection: "parcelas", labelField: "identificador" },
      },
      {
        name: "plantillaId",
        label: "Plantilla",
        type: "reference",
        reference: { collection: "plantillas", labelField: "numero" },
      },
      {
        name: "cicloId",
        label: "Ciclo",
        type: "reference",
        reference: { collection: "ciclos", labelField: "id" },
      },
      {
        name: "detalles",
        label: "Detalles (JSON)",
        type: "json",
        hideInTable: true,
        helper: 'Arreglo de { "productoId", "cantidad", "costoUnitario" }',
      },
    ],
  },
]

export function getModuleBySlug(slug: string): ModuleConfig | undefined {
  return MODULES.find((m) => m.slug === slug)
}

export const MODULE_GROUPS = [
  "Estructura productiva",
  "Producción",
  "Mano de obra",
  "Compras e inventario",
] as const
