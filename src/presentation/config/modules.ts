import type { CollectionName } from "@/core/domain/entities"

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
  options?: { value: string; label: string }[]
  reference?: { collection: CollectionName; labelField: string }
  hideInTable?: boolean
  required?: boolean
  helper?: string
}

export interface ModuleConfig {
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
  /* -------------------------------------------------------------------------- */
  /* 1. Catálogos Principales (Demo C#)                                         */
  /* -------------------------------------------------------------------------- */
  {
    slug: "bancos",
    collection: "cuentas",
    title: "Bancos",
    singular: "Banco / Cuenta",
    description: "Catálogo de cuentas bancarias y fondos de efectivo.",
    group: "Catálogos Principales",
    fields: [
      { name: "nombre", label: "Nombre de la Cuenta", type: "text", required: true },
      {
        name: "titularTipo",
        label: "Propietario / Titular",
        type: "select",
        options: [
          { value: "cliente", label: "Cliente" },
          { value: "proveedor", label: "Proveedor" },
          { value: "trabajador", label: "Trabajador" },
          { value: "familiar", label: "Familiar" },
          { value: "negocio", label: "Negocio / Empresa" },
        ],
      },
      { name: "titularNombre", label: "Nombre del Titular", type: "text" },
      { name: "bancoNombre", label: "Institución / Banco", type: "text" },
      { name: "numeroCuenta", label: "Número de Cuenta / CLABE", type: "text" },
      {
        name: "tipo",
        label: "Tipo de Operación",
        type: "select",
        options: [
          { value: "banco", label: "Banco" },
          { value: "efectivo", label: "Efectivo" },
          { value: "persona", label: "Persona" },
          { value: "reserva", label: "Reserva" },
        ],
        required: true,
      },
      { name: "moneda", label: "Moneda", type: "text", required: true },
      { name: "saldoInicial", label: "Saldo Inicial ($)", type: "number", required: true },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "clientes",
    collection: "clientes",
    title: "Clientes",
    singular: "Cliente",
    description: "Catálogo de clientes compradores.",
    group: "Catálogos Principales",
    fields: [
      { name: "nombreRazonSocial", label: "Nombre / Razón social", type: "text", required: true },
      { name: "rfc", label: "RFC", type: "text" },
      { name: "telefono", label: "Teléfono", type: "text" },
      { name: "email", label: "Correo electrónico", type: "text" },
      { name: "direccion", label: "Dirección", type: "textarea", hideInTable: true },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "proveedores",
    collection: "proveedores",
    title: "Proveedores",
    singular: "Proveedor",
    description: "Catálogo de proveedores de insumos y servicios.",
    group: "Catálogos Principales",
    fields: [
      { name: "razonSocial", label: "Razón social", type: "text", required: true },
      { name: "contacto", label: "Contacto", type: "text" },
      { name: "telefonoPrincipal", label: "Tel. principal", type: "text" },
      { name: "telefonoSecundario", label: "Tel. secundario", type: "text", hideInTable: true },
      { name: "whatsapp", label: "WhatsApp", type: "text", hideInTable: true },
      { name: "email", label: "Correo", type: "text" },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "cat-gastos-operativos",
    collection: "catGastosOperativos",
    title: "Gastos Operativos",
    singular: "Concepto Gasto Operativo",
    description: "Conceptos de gastos de operación.",
    group: "Catálogos Principales",
    fields: [
      { name: "concepto", label: "Concepto de Gasto", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "textarea" },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "cat-gastos-financieros",
    collection: "catGastosFinancieros",
    title: "Gastos Financieros",
    singular: "Concepto Gasto Financiero",
    description: "Conceptos de comisiones, intereses y gastos bancarios.",
    group: "Catálogos Principales",
    fields: [
      { name: "concepto", label: "Concepto Financiero", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "textarea" },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "cat-gastos-administrativos",
    collection: "catGastosAdministrativos",
    title: "Gastos Admvos",
    singular: "Concepto Gasto Administrativo",
    description: "Conceptos de gastos de oficina y administración.",
    group: "Catálogos Principales",
    fields: [
      { name: "concepto", label: "Concepto Administrativo", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "textarea" },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "cat-gastos-familia",
    collection: "catGastosFamilia",
    title: "Gastos de Familia",
    singular: "Concepto Gasto Familiar",
    description: "Conceptos de asignaciones y gastos familiares.",
    group: "Catálogos Principales",
    fields: [
      { name: "concepto", label: "Concepto Familiar", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "textarea" },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "familiares",
    collection: "familiares",
    title: "Familiares",
    singular: "Familiar",
    description: "Catálogo de miembros familiares registrados.",
    group: "Catálogos Principales",
    fields: [
      { name: "nombre", label: "Nombre Completo", type: "text", required: true },
      { name: "parentesco", label: "Parentesco / Relación", type: "text", required: true },
      { name: "telefono", label: "Teléfono", type: "text" },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "trabajadores",
    collection: "trabajadores",
    title: "Trabajadores",
    singular: "Trabajador",
    description: "Catálogo de trabajadores y empleados.",
    group: "Catálogos Principales",
    fields: [
      { name: "nombre", label: "Nombre completo", type: "text", required: true },
      { name: "puesto", label: "Puesto / Función", type: "text", required: true },
      { name: "salarioBase", label: "Salario base ($)", type: "number" },
      { name: "telefono", label: "Teléfono", type: "text" },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "usuarios",
    collection: "usuarios",
    title: "usuarios",
    singular: "Usuario",
    description: "Catálogo de usuarios registrados y sus permisos.",
    group: "Catálogos Principales",
    fields: [
      { name: "nombre", label: "Nombre completo", type: "text", required: true },
      { name: "email", label: "Correo electrónico", type: "text", required: true },
      {
        name: "rol",
        label: "Rol de sistema",
        type: "select",
        options: [
          { value: "admin", label: "Administrador" },
          { value: "persona", label: "Usuario estándar" },
        ],
        required: true,
      },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* 2. Estructura Agrícola (Etapa Posterior)                                    */
  /* -------------------------------------------------------------------------- */
  {
    slug: "ranchos",
    collection: "ranchos",
    title: "Ranchos",
    singular: "Rancho",
    description: "Unidades productivas de mayor nivel.",
    group: "Estructura Agrícola (Etapa Posterior)",
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
    description: "Lotes pertenecientes a un rancho.",
    group: "Estructura Agrícola (Etapa Posterior)",
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
    group: "Estructura Agrícola (Etapa Posterior)",
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

  /* -------------------------------------------------------------------------- */
  /* 3. Producción y Campo (Etapa Posterior)                                   */
  /* -------------------------------------------------------------------------- */
  {
    slug: "ciclos",
    collection: "ciclos",
    title: "Ciclos de cultivo",
    singular: "Ciclo",
    description: "Proceso completo de preparación a cosecha.",
    group: "Producción y Campo (Etapa Posterior)",
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
    group: "Producción y Campo (Etapa Posterior)",
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
    group: "Producción y Campo (Etapa Posterior)",
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
    description: "Catálogo de actividades de mano de obra.",
    group: "Producción y Campo (Etapa Posterior)",
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
    group: "Producción y Campo (Etapa Posterior)",
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
        name: "trabajadorId",
        label: "Trabajador",
        type: "reference",
        reference: { collection: "trabajadores", labelField: "nombre" },
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
      { name: "costo", label: "Costo ($)", type: "number" },
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* 4. Compras e Inventarios                                                   */
  /* -------------------------------------------------------------------------- */
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

  /* -------------------------------------------------------------------------- */
  /* 5. Tesorería y Ventas                                                      */
  /* -------------------------------------------------------------------------- */
  {
    slug: "ventas-pina",
    collection: "ventasPina",
    title: "Ventas de Piña",
    singular: "Venta de Piña",
    description: "Ventas de cosecha de piña vinculadas a folios KG.",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "clienteId",
        label: "Cliente",
        type: "reference",
        reference: { collection: "clientes", labelField: "nombreRazonSocial" },
        required: true,
      },
      { name: "folioLoteProduccion", label: "Folio Lote (KG)", type: "text", required: true },
      { name: "kilosEnviados", label: "Kilos (KG)", type: "number", required: true },
      { name: "precioPorKg", label: "Precio por KG ($)", type: "number", required: true },
      { name: "montoTotal", label: "Monto Total ($)", type: "number", required: true },
      {
        name: "tipoPago",
        label: "Condición de Pago",
        type: "select",
        options: [
          { value: "contado", label: "Contado" },
          { value: "cxc", label: "Cuenta por Cobrar (CxC)" },
        ],
        required: true,
      },
      {
        name: "bancoCuentaId",
        label: "Cuenta de Depósito",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "fecha", label: "Fecha de Venta", type: "date", required: true },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "pagada", label: "Pagada" },
          { value: "pendiente", label: "Pendiente" },
          { value: "parcial", label: "Parcial" },
        ],
      },
    ],
  },
  {
    slug: "ventas-ganado",
    collection: "ventasGanado",
    title: "Ventas de Ganado",
    singular: "Venta de Ganado",
    description: "Ventas comerciales de ganado.",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "clienteId",
        label: "Cliente",
        type: "reference",
        reference: { collection: "clientes", labelField: "nombreRazonSocial" },
        required: true,
      },
      { name: "cabezasOKg", label: "Cabezas / KG", type: "number", required: true },
      { name: "precioUnitario", label: "Precio Unitario ($)", type: "number", required: true },
      { name: "montoTotal", label: "Monto Total ($)", type: "number", required: true },
      {
        name: "tipoPago",
        label: "Condición de Pago",
        type: "select",
        options: [
          { value: "contado", label: "Contado" },
          { value: "cxc", label: "Cuenta por Cobrar (CxC)" },
        ],
        required: true,
      },
      {
        name: "bancoCuentaId",
        label: "Cuenta de Depósito",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "pagada", label: "Pagada" },
          { value: "pendiente", label: "Pendiente" },
        ],
      },
    ],
  },
  {
    slug: "anticipos-clientes",
    collection: "anticiposClientes",
    title: "Anticipos de Clientes",
    singular: "Anticipo",
    description: "Anticipos recibidos de clientes.",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "clienteId",
        label: "Cliente",
        type: "reference",
        reference: { collection: "clientes", labelField: "nombreRazonSocial" },
        required: true,
      },
      {
        name: "bancoCuentaId",
        label: "Cuenta Receptora",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "monto", label: "Monto Anticipo ($)", type: "number", required: true },
      { name: "fecha", label: "Fecha de Recepción", type: "date", required: true },
      { name: "formaPago", label: "Forma de Pago", type: "text" },
      { name: "folio", label: "Folio / Comprobante", type: "text" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "pendiente", label: "Pendiente por aplicar" },
          { value: "aplicado", label: "Aplicado a venta" },
        ],
      },
    ],
  },
  {
    slug: "abonos-clientes",
    collection: "abonosClientes",
    title: "Abonos de Clientes",
    singular: "Abono de Cliente",
    description: "Cobros y abonos aplicados a ventas de piña a crédito (CxC).",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "clienteId",
        label: "Cliente",
        type: "reference",
        reference: { collection: "clientes", labelField: "nombreRazonSocial" },
        required: true,
      },
      {
        name: "ventaId",
        label: "Venta de Piña (Folio Lote)",
        type: "reference",
        reference: { collection: "ventasPina", labelField: "folioLoteProduccion" },
        required: true,
      },
      {
        name: "bancoCuentaId",
        label: "Cuenta de Depósito",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "monto", label: "Monto Abono ($)", type: "number", required: true },
      { name: "fecha", label: "Fecha de Pago", type: "date", required: true },
      { name: "folio", label: "Folio / Comprobante SPEI", type: "text", required: true },
    ],
  },
  {
    slug: "prestamos-bancarios",
    collection: "prestamosBancarios",
    title: "Préstamos Bancarios",
    singular: "Préstamo Bancario",
    description: "Créditos otorgados por instituciones bancarias.",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "bancoCuentaId",
        label: "Cuenta de Depósito",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "bancoNombre", label: "Banco / Institución", type: "text", required: true },
      { name: "folio", label: "Folio / Contrato", type: "text", required: true },
      { name: "montoTotal", label: "Monto Otorgado ($)", type: "number", required: true },
      { name: "tasaInteres", label: "Tasa Interés (%)", type: "number" },
      { name: "fechaConcesion", label: "Fecha de Concesión", type: "date", required: true },
      { name: "saldoPendiente", label: "Saldo Pendiente ($)", type: "number", required: true },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "activo", label: "Activo" },
          { value: "liquidado", label: "Liquidado" },
        ],
      },
    ],
  },
  {
    slug: "prestamos-externos",
    collection: "prestamosExternos",
    title: "Préstamos de Externos",
    singular: "Préstamo Externo",
    description: "Prestamos otorgados por personas externas.",
    group: "Tesorería y Ventas",
    fields: [
      { name: "prestamistaNombre", label: "Nombre del Prestamista", type: "text", required: true },
      {
        name: "bancoCuentaId",
        label: "Cuenta de Depósito",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "folio", label: "Folio / Pagaré", type: "text", required: true },
      { name: "montoTotal", label: "Monto Prestado ($)", type: "number", required: true },
      { name: "fechaConcesion", label: "Fecha de Recepción", type: "date", required: true },
      { name: "saldoPendiente", label: "Saldo Pendiente ($)", type: "number", required: true },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "activo", label: "Activo" },
          { value: "liquidado", label: "Liquidado" },
        ],
      },
    ],
  },
  {
    slug: "abonos-prestamos",
    collection: "abonosPrestamos",
    title: "Abonos a Préstamos",
    singular: "Abono a Préstamo",
    description: "Pagos y abonos a capital.",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "tipoPrestamo",
        label: "Tipo de Préstamo",
        type: "select",
        options: [
          { value: "bancario", label: "Bancario" },
          { value: "externo", label: "Externo" },
        ],
        required: true,
      },
      { name: "prestamoId", label: "ID Préstamo", type: "text", required: true },
      {
        name: "bancoCuentaId",
        label: "Cuenta de Origen (Pago)",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "monto", label: "Monto Abono ($)", type: "number", required: true },
      { name: "fecha", label: "Fecha de Abono", type: "date", required: true },
      { name: "folio", label: "Folio / Comprobante", type: "text" },
    ],
  },
  {
    slug: "transferencias-hijuelos",
    collection: "transferenciasHijuelos",
    title: "Transferencias (Compra Hijuelos)",
    singular: "Transferencia",
    description: "Transferencias inter-cuentas bajo concepto 'Compra de Hijuelos'.",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "cuentaOrigenId",
        label: "Cuenta Origen",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      {
        name: "cuentaDestinoId",
        label: "Cuenta Destino",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "monto", label: "Monto Transferido ($)", type: "number", required: true },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "folioFiscal", label: "Folio Fiscal", type: "text", required: true },
      { name: "conceptoFiscal", label: "Concepto Fiscal", type: "text", required: true },
      { name: "observaciones", label: "Observaciones", type: "textarea", hideInTable: true },
    ],
  },
  {
    slug: "cargos-comisiones",
    collection: "cargosComisiones",
    title: "Cargos y Comisiones Bancarias",
    singular: "Comisión Bancaria",
    description: "Comisiones y gastos bancarios.",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "bancoCuentaId",
        label: "Cuenta Bancaria",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      {
        name: "catGastoFinancieroId",
        label: "Concepto Gasto Financiero",
        type: "reference",
        reference: { collection: "catGastosFinancieros", labelField: "concepto" },
        required: true,
      },
      { name: "monto", label: "Monto ($)", type: "number", required: true },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "folio", label: "Folio / Referencia", type: "text" },
      { name: "observaciones", label: "Observaciones", type: "textarea", hideInTable: true },
    ],
  },
  {
    slug: "gastos-externos",
    collection: "gastosExternos",
    title: "Otros Gastos Externos",
    singular: "Gasto Externo",
    description: "Gastos clasificados externos.",
    group: "Tesorería y Ventas",
    fields: [
      {
        name: "tipoGasto",
        label: "Tipo de Gasto",
        type: "select",
        options: [
          { value: "operativo", label: "Operativo" },
          { value: "administrativo", label: "Administrativo" },
          { value: "familiar", label: "Familiar" },
        ],
        required: true,
      },
      { name: "catGastoId", label: "ID Concepto Gasto", type: "text", required: true },
      {
        name: "familiarId",
        label: "Familiar Asignado",
        type: "reference",
        reference: { collection: "familiares", labelField: "nombre" },
      },
      {
        name: "bancoCuentaId",
        label: "Cuenta de Origen",
        type: "reference",
        reference: { collection: "cuentas", labelField: "nombre" },
        required: true,
      },
      { name: "monto", label: "Monto ($)", type: "number", required: true },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "folioFactura", label: "Folio Factura", type: "text" },
      { name: "observaciones", label: "Observaciones", type: "textarea", hideInTable: true },
    ],
  },
  {
    slug: "categorias",
    collection: "categorias",
    title: "Categorías de Tesorería",
    singular: "Categoría",
    description: "Árbol de categorías de ingreso y egreso.",
    group: "Tesorería y Ventas",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        options: [
          { value: "ingreso", label: "Ingreso" },
          { value: "egreso", label: "Egreso" },
        ],
        required: true,
      },
      {
        name: "parentId",
        label: "Categoría padre",
        type: "reference",
        reference: { collection: "categorias", labelField: "nombre" },
        helper: "Vacío = categoría raíz.",
      },
      { name: "orden", label: "Orden", type: "number", required: true },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
]

export function getModuleBySlug(slug: string): ModuleConfig | undefined {
  if (slug === "cuentas") {
    return MODULES.find((m) => m.slug === "bancos")
  }
  return MODULES.find((m) => m.slug === slug)
}

export const MODULE_GROUPS = [
  "Catálogos Principales",
  "Estructura Agrícola (Etapa Posterior)",
  "Producción y Campo (Etapa Posterior)",
  "Compras e inventario",
  "Tesorería y Ventas",
] as const

export const PRIMARY_CATALOG_ITEMS = [
  { slug: "bancos", title: "Bancos" },
  { slug: "clientes", title: "Clientes" },
  { slug: "proveedores", title: "Proveedores" },
  { slug: "cat-gastos-operativos", title: "Gastos Operativos" },
  { slug: "cat-gastos-financieros", title: "Gastos Financieros" },
  { slug: "cat-gastos-administrativos", title: "Gastos Admvos" },
  { slug: "cat-gastos-familia", title: "Gastos de Familia" },
  { slug: "familiares", title: "Familiares" },
  { slug: "trabajadores", title: "Trabajadores" },
  { slug: "usuarios", title: "usuarios" },
] as const
