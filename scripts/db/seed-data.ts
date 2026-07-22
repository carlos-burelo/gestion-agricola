import { fakerES_MX as faker } from "@faker-js/faker"
import { hashPassword } from "@/infrastructure/auth/password"

faker.seed(2026)

function ts(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day, 14, 0, 0).toISOString()
}

function ymd(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

export function generateSeedData() {
  const ranchos = [
    { id: "rancho-1", nombre: "Rancho El Paraíso", estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
    { id: "rancho-2", nombre: "Rancho La Guadalupana", estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
    { id: "rancho-3", nombre: "Rancho San José Isla", estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
  ]

  const parcelas = [
    { id: "parcela-1", ranchoId: "rancho-1", identificador: "Lote A-1 (Piña MD2)", superficieM2: 50000, estado: "activo", esSemillero: false, createdAt: ts(2025, 1, 2), updatedAt: ts(2025, 1, 2) },
    { id: "parcela-2", ranchoId: "rancho-1", identificador: "Lote A-2 (Semillero)", superficieM2: 25000, estado: "activo", esSemillero: true, createdAt: ts(2025, 1, 2), updatedAt: ts(2025, 1, 2) },
    { id: "parcela-3", ranchoId: "rancho-1", identificador: "Lote A-3 (Piña MD2)", superficieM2: 75000, estado: "activo", esSemillero: false, createdAt: ts(2025, 1, 2), updatedAt: ts(2025, 1, 2) },
    { id: "parcela-4", ranchoId: "rancho-2", identificador: "Lote B-1 (Piña Champaka)", superficieM2: 60000, estado: "activo", esSemillero: false, createdAt: ts(2025, 1, 2), updatedAt: ts(2025, 1, 2) },
    { id: "parcela-5", ranchoId: "rancho-2", identificador: "Lote B-2 (Ganado Bovino)", superficieM2: 120000, estado: "activo", esSemillero: false, createdAt: ts(2025, 1, 2), updatedAt: ts(2025, 1, 2) },
    { id: "parcela-6", ranchoId: "rancho-3", identificador: "Lote C-1 (Piña MD2 Isla)", superficieM2: 90000, estado: "activo", esSemillero: false, createdAt: ts(2025, 1, 2), updatedAt: ts(2025, 1, 2) },
  ]

  const plantillas = [
    { id: "plantilla-1", parcelaId: "parcela-1", numero: "P-101", superficieM2: 25000, createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
    { id: "plantilla-2", parcelaId: "parcela-1", numero: "P-102", superficieM2: 25000, createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
    { id: "plantilla-3", parcelaId: "parcela-2", numero: "P-201", superficieM2: 25000, createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
    { id: "plantilla-4", parcelaId: "parcela-3", numero: "P-301", superficieM2: 37500, createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
    { id: "plantilla-5", parcelaId: "parcela-3", numero: "P-302", superficieM2: 37500, createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
    { id: "plantilla-6", parcelaId: "parcela-4", numero: "P-401", superficieM2: 30000, createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
    { id: "plantilla-7", parcelaId: "parcela-6", numero: "P-601", superficieM2: 45000, createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
  ]

  const ciclos = [
    { id: "ciclo-1", parcelaId: "parcela-1", fechaInicio: "2025-01-10", fechaCosechaEstimada: "2026-05-15", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "ciclo-2", parcelaId: "parcela-2", fechaInicio: "2025-02-01", fechaCosechaEstimada: "2025-11-30", estado: "cosechado", createdAt: ts(2025, 2, 1), updatedAt: ts(2025, 2, 1) },
    { id: "ciclo-3", parcelaId: "parcela-3", fechaInicio: "2025-03-15", fechaCosechaEstimada: "2026-07-20", estado: "activo", createdAt: ts(2025, 3, 15), updatedAt: ts(2025, 3, 15) },
    { id: "ciclo-4", parcelaId: "parcela-4", fechaInicio: "2025-04-01", fechaCosechaEstimada: "2026-08-30", estado: "activo", createdAt: ts(2025, 4, 1), updatedAt: ts(2025, 4, 1) },
    { id: "ciclo-5", parcelaId: "parcela-6", fechaInicio: "2025-05-10", fechaCosechaEstimada: "2026-09-15", estado: "planeado", createdAt: ts(2025, 5, 10), updatedAt: ts(2025, 5, 10) },
  ]

  const siembras = [
    { id: "siembra-1", cicloId: "ciclo-1", plantillaId: "plantilla-1", fecha: "2025-01-15", cantidadPlantas: 55000, costoUnitarioPlanta: 1.8, createdAt: ts(2025, 1, 15), updatedAt: ts(2025, 1, 15) },
    { id: "siembra-2", cicloId: "ciclo-3", plantillaId: "plantilla-4", fecha: "2025-03-20", cantidadPlantas: 80000, costoUnitarioPlanta: 1.75, createdAt: ts(2025, 3, 20), updatedAt: ts(2025, 3, 20) },
    { id: "siembra-3", cicloId: "ciclo-4", plantillaId: "plantilla-6", fecha: "2025-04-10", cantidadPlantas: 65000, costoUnitarioPlanta: 1.82, createdAt: ts(2025, 4, 10), updatedAt: ts(2025, 4, 10) },
  ]

  const semilleros = [
    { id: "semillero-1", parcelaId: "parcela-2", fechaProduccion: "2025-01-30", costoManoObra: 18000, costoInsumos: 9500, costoMaquinaria: 6000, plantasProducidas: 24000, createdAt: ts(2025, 1, 30), updatedAt: ts(2025, 1, 30) },
    { id: "semillero-2", parcelaId: "parcela-2", fechaProduccion: "2025-03-15", costoManoObra: 22000, costoInsumos: 11200, costoMaquinaria: 7500, plantasProducidas: 31000, createdAt: ts(2025, 3, 15), updatedAt: ts(2025, 3, 15) },
  ]

  const actividades = [
    { id: "act-1", nombre: "Preparación y Rastreo de Suelo", descripcion: "Paso de rastra pesada y acondicionamiento del terreno.", createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
    { id: "act-2", nombre: "Acamado y Colocación de Acolchado", descripcion: "Levantamiento de camas con acolchado plástico agrícola.", createdAt: ts(2025, 1, 6), updatedAt: ts(2025, 1, 6) },
    { id: "act-3", nombre: "Siembra Manual de Hijuelos", descripcion: "Plante manual de fruta MD2 en densidad óptima.", createdAt: ts(2025, 1, 7), updatedAt: ts(2025, 1, 7) },
    { id: "act-4", nombre: "Foliación y Nutrición Vegetativa", descripcion: "Aplicación foliar de fertilizantes, nitrógeno y potasio.", createdAt: ts(2025, 1, 8), updatedAt: ts(2025, 1, 8) },
    { id: "act-5", nombre: "Inducción Floral (Inductor)", descripcion: "Aplicación de inductor floración en época programada.", createdAt: ts(2025, 1, 9), updatedAt: ts(2025, 1, 9) },
    { id: "act-6", nombre: "Deshierbe Manual y Limpieza", descripcion: "Deshierbe de camas y cajetes en parcela.", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "act-7", nombre: "Corte y Cosecha de Piña", descripcion: "Corte de piña madura y carga a camión en empaque.", createdAt: ts(2025, 1, 11), updatedAt: ts(2025, 1, 11) },
  ]

  const trabajadores = Array.from({ length: 8 }).map((_, i) => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const puestos = ["Mayordomo de Campo", "Cortador de Piña", "Tractorista", "Fumigador / Capataz", "Auxiliar Agrícola"]
    return {
      id: `trabajador-${i + 1}`,
      nombre: `${firstName} ${lastName}`,
      puesto: puestos[i % puestos.length],
      salarioBase: faker.number.int({ min: 3500, max: 8000 }),
      telefono: faker.phone.number({ style: "national" }),
      estado: "activo",
      createdAt: ts(2025, 1, 10),
      updatedAt: ts(2025, 1, 10),
    }
  })

  const productos = [
    { id: "producto-1", ingredienteActivo: "Glifosato 480 g/L", nombreComercial: "Faena Fuerte 360", presentacion: "Bidón 20 L", unidadMedida: "litro", createdAt: ts(2025, 1, 8), updatedAt: ts(2025, 1, 8) },
    { id: "producto-2", ingredienteActivo: "Urea Agrícola 46% N", nombreComercial: "UreaMax Granulado", presentacion: "Saco 50 kg", unidadMedida: "kilogramo", createdAt: ts(2025, 1, 8), updatedAt: ts(2025, 1, 8) },
    { id: "producto-3", ingredienteActivo: "Mancozeb 80% WP", nombreComercial: "Dithane M-45 Fungicida", presentacion: "Bolsa 1 kg", unidadMedida: "kilogramo", createdAt: ts(2025, 1, 8), updatedAt: ts(2025, 1, 8) },
    { id: "producto-4", ingredienteActivo: "NPK 12-24-12", nombreComercial: "Nitrofoska Azul Especial", presentacion: "Saco 50 kg", unidadMedida: "kilogramo", createdAt: ts(2025, 1, 8), updatedAt: ts(2025, 1, 8) },
    { id: "producto-5", ingredienteActivo: "Etefón 480 g/L", nombreComercial: "Ethrel Inductor Floral", presentacion: "Frasco 1 L", unidadMedida: "litro", createdAt: ts(2025, 1, 8), updatedAt: ts(2025, 1, 8) },
    { id: "producto-6", ingredienteActivo: "Imidacloprid 350 SC", nombreComercial: "Confidor Insecticida", presentacion: "Frasco 1 L", unidadMedida: "litro", createdAt: ts(2025, 1, 8), updatedAt: ts(2025, 1, 8) },
  ]

  const proveedores = Array.from({ length: 5 }).map((_, i) => {
    const companyName = faker.company.name()
    return {
      id: `proveedor-${i + 1}`,
      razonSocial: `${companyName} S.A. de C.V.`,
      contacto: `${faker.person.firstName()} ${faker.person.lastName()}`,
      telefonoPrincipal: faker.phone.number({ style: "national" }),
      telefonoSecundario: faker.phone.number({ style: "national" }),
      whatsapp: faker.phone.number({ style: "national" }),
      email: faker.internet.email().toLowerCase(),
      estado: "activo",
      createdAt: ts(2025, 1, 3),
      updatedAt: ts(2025, 1, 3),
    }
  })

  // Generate 40 labor activity records over Jan - Jul 2025
  const registrosActividad = Array.from({ length: 40 }).map((_, i) => {
    const m = (i % 7) + 1
    const d = (i % 25) + 1
    const act = actividades[i % actividades.length]
    const trab = trabajadores[i % trabajadores.length]
    const parc = parcelas[i % parcelas.length]
    const plant = plantillas[i % plantillas.length]
    const cic = ciclos[i % ciclos.length]
    const costo = (i % 5 + 1) * 1400 + faker.number.int({ min: 100, max: 800 })
    return {
      id: `reg-act-${i + 1}`,
      fecha: ymd(2025, m, d),
      actividadId: act.id,
      trabajadorId: trab.id,
      ranchoId: parc.ranchoId,
      parcelaId: parc.id,
      plantillaId: plant.id,
      cicloId: cic.id,
      responsable: trab.nombre,
      cantidad: faker.number.int({ min: 5, max: 30 }),
      costo,
      createdAt: ts(2025, m, d),
      updatedAt: ts(2025, m, d),
    }
  })

  // Generate 30 inventory movements (entradas y salidas)
  const movimientosInventario = Array.from({ length: 30 }).map((_, i) => {
    const isEntrada = i % 2 === 0
    const m = (i % 7) + 1
    const d = (i % 25) + 1
    const prod = productos[i % productos.length]
    const prov = proveedores[i % proveedores.length]
    const cant = isEntrada ? (i + 1) * 80 : (i + 1) * 25
    const unit = (i + 1) * 120 + 50
    return {
      id: `mov-${i + 1}`,
      productoId: prod.id,
      tipo: isEntrada ? "entrada" : "salida",
      fecha: ymd(2025, m, d),
      cantidad: cant,
      costoUnitario: unit,
      proveedorId: prov.id,
      factura: isEntrada ? `FAC-2025-${100 + i}` : "",
      destino: isEntrada ? "Almacén General" : `Aplicación Lote A-${(i % 3) + 1}`,
      createdAt: ts(2025, m, d),
      updatedAt: ts(2025, m, d),
    }
  })

  // Generate 15 vales de salida with child details
  const valesSalida = Array.from({ length: 15 }).map((_, i) => {
    const m = (i % 7) + 1
    const d = (i % 25) + 1
    const parc = parcelas[i % parcelas.length]
    const plant = plantillas[i % plantillas.length]
    const cic = ciclos[i % ciclos.length]
    const prod1 = productos[i % productos.length]
    const prod2 = productos[(i + 1) % productos.length]
    return {
      id: `vale-${i + 1}`,
      folio: `VAL-2025-${String(i + 1).padStart(3, "0")}`,
      fecha: ymd(2025, m, d),
      responsable: trabajadores[i % trabajadores.length].nombre,
      ranchoId: parc.ranchoId,
      parcelaId: parc.id,
      plantillaId: plant.id,
      cicloId: cic.id,
      detalles: [
        { productoId: prod1.id, cantidad: 15 + i, costoUnitario: 350 + i * 10 },
        { productoId: prod2.id, cantidad: 8 + i, costoUnitario: 520 + i * 15 },
      ],
      createdAt: ts(2025, m, d),
      updatedAt: ts(2025, m, d),
    }
  })

  // Generate 12 purchase orders
  const estadosOC = ["borrador", "autorizada", "parcial", "surtida", "cancelada"] as const
  const ordenesCompra = Array.from({ length: 12 }).map((_, i) => {
    const m = (i % 6) + 1
    const d = (i % 20) + 1
    const prov = proveedores[i % proveedores.length]
    const prod = productos[i % productos.length]
    return {
      id: `oc-${i + 1}`,
      folio: `OC-2025-${String(i + 1).padStart(3, "0")}`,
      fecha: ymd(2025, m, d),
      proveedorId: prov.id,
      estado: estadosOC[i % estadosOC.length],
      detalles: [
        { productoId: prod.id, cantidad: 50 + i * 10, precioUnitario: 300 + i * 20 },
      ],
      createdAt: ts(2025, m, d),
      updatedAt: ts(2025, m, d),
    }
  })

  // Generate 12 accounts payable
  const estadosCxP = ["pendiente", "pagada", "vencida"] as const
  const cuentasPorPagar = Array.from({ length: 12 }).map((_, i) => {
    const m = (i % 6) + 2
    const d = (i % 20) + 1
    const prov = proveedores[i % proveedores.length]
    return {
      id: `cxp-${i + 1}`,
      proveedorId: prov.id,
      factura: `FAC-PROV-${200 + i}`,
      importe: 18000 + i * 8500,
      fechaVencimiento: ymd(2025, m, d),
      estado: estadosCxP[i % estadosCxP.length],
      createdAt: ts(2025, m - 1, d),
      updatedAt: ts(2025, m - 1, d),
    }
  })

  // Requerimientos, Cotizaciones, Recepciones
  const requerimientos = Array.from({ length: 8 }).map((_, i) => {
    const m = (i % 5) + 1
    const d = (i % 20) + 1
    return {
      id: `req-${i + 1}`,
      folio: `REQ-2025-${String(i + 1).padStart(3, "0")}`,
      fecha: ymd(2025, m, d),
      solicitante: "Ing. Agrónomo Manuel Silva",
      observaciones: "Solicitud urgente para nutrición foliar y fertilizante.",
      detalles: [
        { productoId: productos[i % productos.length].id, cantidad: 40 + i * 5, unidadMedida: productos[i % productos.length].unidadMedida },
      ],
      createdAt: ts(2025, m, d),
      updatedAt: ts(2025, m, d),
    }
  })

  const cotizaciones = Array.from({ length: 8 }).map((_, i) => {
    const m = (i % 5) + 1
    const d = (i % 20) + 5
    return {
      id: `cot-${i + 1}`,
      requerimientoId: `req-${i + 1}`,
      proveedorId: proveedores[i % proveedores.length].id,
      fecha: ymd(2025, m, d),
      estado: i % 2 === 0 ? "cotizada" : "comprada",
      detalles: [
        { productoId: productos[i % productos.length].id, cantidad: 40 + i * 5, precioUnitario: 280 + i * 15 },
      ],
      createdAt: ts(2025, m, d),
      updatedAt: ts(2025, m, d),
    }
  })

  const recepciones = Array.from({ length: 6 }).map((_, i) => {
    const m = (i % 5) + 2
    const d = (i % 20) + 2
    return {
      id: `rec-${i + 1}`,
      ordenCompraId: `oc-${i + 1}`,
      factura: `FAC-REC-${300 + i}`,
      fecha: ymd(2025, m, d),
      detalles: [
        { productoId: productos[i % productos.length].id, cantidad: 50 + i * 10, costoUnitario: 300 + i * 20 },
      ],
      createdAt: ts(2025, m, d),
      updatedAt: ts(2025, m, d),
    }
  })

  const clientes = Array.from({ length: 5 }).map((_, i) => {
    const companyName = faker.company.name()
    return {
      id: `cliente-${i + 1}`,
      nombreRazonSocial: `Comercializadora ${companyName}`,
      rfc: faker.string.alphanumeric({ length: 13 }).toUpperCase(),
      telefono: faker.phone.number({ style: "national" }),
      email: faker.internet.email().toLowerCase(),
      direccion: `${faker.location.streetAddress()}, ${faker.location.city()}, Veracruz`,
      estado: "activo",
      createdAt: ts(2025, 1, 3),
      updatedAt: ts(2025, 1, 3),
    }
  })

  const catGastosOperativos = [
    { id: "cat-op-1", concepto: "Mantenimiento de Maquinaria y Tractores", descripcion: "Reparaciones, aceite y refacciones de equipo de trabajo.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-op-2", concepto: "Fletes y Acarreo de Fruta", descripcion: "Pago de camiones para traslado de piña del campo a empaque.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-op-3", concepto: "Combustible Diesel y Gasolina", descripcion: "Suministro de combustible para operación diaria.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-op-4", concepto: "Mano de Obra Eventual Cosecha", descripcion: "Jornales extraordinarios en época de corte.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
  ]

  const catGastosFinancieros = [
    { id: "cat-fin-1", concepto: "Comisiones Bancarias", descripcion: "Comisiones y cargos por manejo de cuenta bancaria.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-fin-2", concepto: "Intereses por Préstamo Bancario", descripcion: "Pago de intereses ordinarios y moratorios.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-fin-3", concepto: "Comisiones por Transferencias SPEI", descripcion: "Tarifa por emisión de pagos interbancarios.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
  ]

  const catGastosAdministrativos = [
    { id: "cat-adm-1", concepto: "Honorarios Contables y Legales", descripcion: "Servicios de asesoría fiscal y contabilidad externa.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-adm-2", concepto: "Suscripciones y Licencias de Software", descripcion: "Pago de licencias y herramientas administrativas.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-adm-3", concepto: "Papelería y Consumibles Oficina", descripcion: "Hojas, carpetas, tinta y consumibles.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
  ]

  const catGastosFamilia = [
    { id: "cat-fam-1", concepto: "Manutención Familiar Mensual", descripcion: "Asignación mensual para gastos de casa y familia.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-fam-2", concepto: "Colegiaturas y Educación", descripcion: "Pago de colegiaturas y útiles escolares.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "cat-fam-3", concepto: "Gastos Médicos y Salud", descripcion: "Consultas, medicinas y seguros familiares.", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
  ]

  const familiares = [
    { id: "fam-1", nombre: "Don Carlos Burelo (Padre)", parentesco: "Padre", telefono: "287-111-9988", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "fam-2", nombre: "María Elena Burelo (Hija)", parentesco: "Hija", telefono: "287-222-7766", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "fam-3", nombre: "Sofia Burelo (Esposa)", parentesco: "Esposa", telefono: "287-333-5544", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
  ]

  const cuentas = [
    { id: "cuenta-1", nombre: "Cuenta BBVA Don Carlos Burelo", tipo: "banco", titularTipo: "familiar", titularNombre: "Don Carlos Burelo (Padre)", bancoNombre: "BBVA Bancomer", numeroCuenta: "012345678901234567", moneda: "MXN", saldoInicial: 285000, estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
    { id: "cuenta-2", nombre: "Cuenta Banamex Agroquímicos Golfo", tipo: "banco", titularTipo: "proveedor", titularNombre: proveedores[0].razonSocial, bancoNombre: "Citibanamex", numeroCuenta: "002180019283746501", moneda: "MXN", saldoInicial: 140000, estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
    { id: "cuenta-3", nombre: "Cuenta Comercializadora Frutas Sur", tipo: "banco", titularTipo: "cliente", titularNombre: clientes[0].nombreRazonSocial, bancoNombre: "BBVA Bancomer", numeroCuenta: "012890987654321098", moneda: "MXN", saldoInicial: 195000, estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
    { id: "cuenta-4", nombre: "Cuenta Banco Azteca Juan Pérez", tipo: "persona", titularTipo: "trabajador", titularNombre: trabajadores[0].nombre, bancoNombre: "Banco Azteca", numeroCuenta: "1273901928374", moneda: "MXN", saldoInicial: 35000, estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
    { id: "cuenta-5", nombre: "Caja Chica Efectivo Rancho 1", tipo: "efectivo", titularTipo: "negocio", titularNombre: "AgroPiña Rancho El Paraíso", bancoNombre: "Efectivo", numeroCuenta: "CAJA-01", moneda: "MXN", saldoInicial: 25000, estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
  ]

  const ventasPina = [
    { id: "vta-pina-1", clienteId: "cliente-1", folioLoteProduccion: "FOL-2025-L01-KG8500", kilosEnviados: 8500, precioPorKg: 8.5, montoTotal: 72250, tipoPago: "contado", bancoCuentaId: "cuenta-1", fecha: "2025-05-15", estado: "pagada", createdAt: ts(2025, 5, 15), updatedAt: ts(2025, 5, 15) },
    { id: "vta-pina-2", clienteId: "cliente-2", folioLoteProduccion: "FOL-2025-L02-KG12000", kilosEnviados: 12000, precioPorKg: 8.0, montoTotal: 96000, tipoPago: "cxc", bancoCuentaId: "cuenta-1", fecha: "2025-06-10", estado: "pendiente", createdAt: ts(2025, 6, 10), updatedAt: ts(2025, 6, 10) },
  ]

  const ventasGanado = [
    { id: "vta-gan-1", clienteId: "cliente-3", cabezasOKg: 15, precioUnitario: 18000, montoTotal: 270000, tipoPago: "contado", bancoCuentaId: "cuenta-2", fecha: "2025-04-20", estado: "pagada", createdAt: ts(2025, 4, 20), updatedAt: ts(2025, 4, 20) },
  ]

  const anticiposClientes = [
    { id: "ant-cli-1", clienteId: "cliente-2", bancoCuentaId: "cuenta-1", monto: 30000, fecha: "2025-06-01", formaPago: "Transferencia SPEI", folio: "SPEI-889012", estado: "pendiente", createdAt: ts(2025, 6, 1), updatedAt: ts(2025, 6, 1) },
  ]

  const abonosClientes = [
    { id: "abn-cli-1", clienteId: "cliente-2", ventaId: "vta-pina-2", bancoCuentaId: "cuenta-1", monto: 20000, fecha: "2025-06-25", folio: "SPEI-992011", createdAt: ts(2025, 6, 25), updatedAt: ts(2025, 6, 25) },
  ]

  const prestamosBancarios = [
    { id: "prest-banc-1", bancoCuentaId: "cuenta-1", bancoNombre: "BBVA Bancomer", folio: "CR-990812-BBVA", montoTotal: 500000, tasaInteres: 14.5, fechaConcesion: "2025-02-01", saldoPendiente: 380000, estado: "activo", createdAt: ts(2025, 2, 1), updatedAt: ts(2025, 2, 1) },
  ]

  const prestamosExternos = [
    { id: "prest-ext-1", prestamistaNombre: "Ing. Fernando Donoso (Socio External)", bancoCuentaId: "cuenta-2", folio: "PAGARE-004", montoTotal: 150000, fechaConcesion: "2025-03-15", saldoPendiente: 100000, estado: "activo", createdAt: ts(2025, 3, 15), updatedAt: ts(2025, 3, 15) },
  ]

  const abonosPrestamos = [
    { id: "abn-prest-1", tipoPrestamo: "bancario", prestamoId: "prest-banc-1", bancoCuentaId: "cuenta-1", monto: 40000, fecha: "2025-03-01", folio: "TRANS-0912", createdAt: ts(2025, 3, 1), updatedAt: ts(2025, 3, 1) },
    { id: "abn-prest-2", tipoPrestamo: "externo", prestamoId: "prest-ext-1", bancoCuentaId: "cuenta-2", monto: 50000, fecha: "2025-05-10", folio: "TRANS-7721", createdAt: ts(2025, 5, 10), updatedAt: ts(2025, 5, 10) },
  ]

  const transferenciasHijuelos = [
    { id: "trans-hij-1", cuentaOrigenId: "cuenta-1", cuentaDestinoId: "cuenta-2", monto: 75000, fecha: "2025-04-05", folioFiscal: "FAC-HIJ-2025-09", conceptoFiscal: "Compra de hijuelos de piña en densidad de siembra", observaciones: "Operación de compra ficticia de hijuelos por justificación fiscal.", createdAt: ts(2025, 4, 5), updatedAt: ts(2025, 4, 5) },
  ]

  const cargosComisiones = [
    { id: "cargo-com-1", bancoCuentaId: "cuenta-1", catGastoFinancieroId: "cat-fin-1", monto: 1850, folio: "CARGO-BANK-049", fecha: "2025-05-31", observaciones: "Comisión mensual por manejo de cuenta corporativa e IVA.", createdAt: ts(2025, 5, 31), updatedAt: ts(2025, 5, 31) },
  ]

  const gastosExternos = [
    { id: "gasto-ext-1", tipoGasto: "familiar", catGastoId: "cat-fam-1", familiarId: "fam-1", bancoCuentaId: "cuenta-1", monto: 25000, fecha: "2025-06-05", folioFactura: "", observaciones: "Entrega de manutención mensual a Don Carlos Burelo.", createdAt: ts(2025, 6, 5), updatedAt: ts(2025, 6, 5) },
    { id: "gasto-ext-2", tipoGasto: "familiar", catGastoId: "cat-fam-2", familiarId: "fam-2", bancoCuentaId: "cuenta-1", monto: 12000, fecha: "2025-06-12", folioFactura: "FAC-EDUC-0812", observaciones: "Pago de colegiatura semestral María Elena.", createdAt: ts(2025, 6, 12), updatedAt: ts(2025, 6, 12) },
    { id: "gasto-ext-3", tipoGasto: "operativo", catGastoId: "cat-op-1", familiarId: "", bancoCuentaId: "cuenta-2", monto: 8500, fecha: "2025-06-18", folioFactura: "FAC-REFAC-9901", observaciones: "Reparación de embrague tractor John Deere.", createdAt: ts(2025, 6, 18), updatedAt: ts(2025, 6, 18) },
  ]

  const adminPasswordHash = hashPassword(process.env.ADMIN_PASSWORD ?? "admin123")
  const userPasswordHash = hashPassword("operador123")

  const usuarios = [
    { id: "usr-admin", nombre: "Administrador General", email: "admin@agropina.mx", passwordHash: adminPasswordHash, rol: "admin", estado: "activo", createdAt: ts(2025, 1, 1), updatedAt: ts(2025, 1, 1) },
    { id: "usr-operador-1", nombre: "Operador de Cajas Campo", email: "cajas@agropina.mx", passwordHash: userPasswordHash, rol: "persona", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
  ]

  const usuarioCuentas = [
    { id: "uc-1", usuarioId: "usr-operador-1", cuentaId: "cuenta-5", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
    { id: "uc-2", usuarioId: "usr-operador-1", cuentaId: "cuenta-4", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
  ]

  return {
    ranchos, parcelas, plantillas, ciclos, siembras, semilleros, actividades, trabajadores,
    registrosActividad, productos, proveedores,
    movimientosInventario, requerimientos, cotizaciones,
    ordenesCompra, recepciones, cuentasPorPagar, valesSalida,
    clientes, catGastosOperativos, catGastosFinancieros, catGastosAdministrativos,
    catGastosFamilia, familiares, ventasPina, ventasGanado, anticiposClientes,
    abonosClientes, prestamosBancarios, prestamosExternos, abonosPrestamos,
    transferenciasHijuelos, cargosComisiones, gastosExternos, categorias: [],
    cuentas, usuarios, usuarioCuentas, traspasos: [], movimientos: []
  }
}
