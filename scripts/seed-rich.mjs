// Deterministic rich-seed generator for AgroPiña.
// Expands the demo dataset across 18 months keeping foreign keys consistent and
// PEPS inventory positive. Writes the SAME document to the bundled seed and the
// live .data file so the running dev server (which caches the seed module)
// reloads with the new data.
import { writeFileSync } from "node:fs"
import path from "node:path"

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(20260618)
const rnd = (min, max) => min + Math.floor(rng() * (max - min + 1))
const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const pad = (n) => String(n).padStart(2, "0")
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`
const ts = (y, m, d) => `${iso(y, m, d)}T08:00:00.000Z`

const months = []
for (let y = 2025; y <= 2026; y++) {
  for (let m = 1; m <= 12; m++) {
    if (y === 2026 && m > 6) break
    months.push({ y, m })
  }
}

// ---- Catalogs (existing records kept verbatim + new ones) -------------------
const ranchos = [
  { id: "rancho-1", nombre: "Rancho El Porvenir", estado: "activo", createdAt: ts(2025, 1, 10), updatedAt: ts(2025, 1, 10) },
  { id: "rancho-2", nombre: "Rancho La Esperanza", estado: "activo", createdAt: ts(2025, 1, 12), updatedAt: ts(2025, 1, 12) },
  { id: "rancho-3", nombre: "Rancho San Isidro", estado: "activo", createdAt: ts(2025, 1, 14), updatedAt: ts(2025, 1, 14) },
]

// Demo parcel boundary (~250 m box) around a [lng, lat] center near Loma
// Bonita (zona piñera de Veracruz/Oaxaca). Editable/replaceable on the map.
function box(lng, lat, d = 0.0022) {
  return {
    type: "Polygon",
    coordinates: [[
      [lng - d, lat - d],
      [lng + d, lat - d],
      [lng + d, lat + d],
      [lng - d, lat + d],
      [lng - d, lat - d],
    ]],
  }
}
const PARCEL_GEO = {
  "parcela-1": box(-95.882, 18.104),
  "parcela-2": box(-95.876, 18.103),
  "parcela-3": box(-95.870, 18.108),
  "parcela-4": box(-95.864, 18.106),
  "parcela-5": box(-95.858, 18.110),
  "parcela-6": box(-95.852, 18.101),
}

const parcelas = [
  { id: "parcela-1", ranchoId: "rancho-1", identificador: "L-01", superficieM2: 20000, estado: "activo", esSemillero: false, geometria: PARCEL_GEO["parcela-1"], createdAt: ts(2025, 1, 15), updatedAt: ts(2025, 1, 15) },
  { id: "parcela-2", ranchoId: "rancho-1", identificador: "L-02", superficieM2: 15000, estado: "activo", esSemillero: true, geometria: PARCEL_GEO["parcela-2"], createdAt: ts(2025, 1, 15), updatedAt: ts(2025, 1, 15) },
  { id: "parcela-3", ranchoId: "rancho-2", identificador: "L-01", superficieM2: 18000, estado: "activo", esSemillero: false, geometria: PARCEL_GEO["parcela-3"], createdAt: ts(2025, 1, 16), updatedAt: ts(2025, 1, 16) },
  { id: "parcela-4", ranchoId: "rancho-2", identificador: "L-02", superficieM2: 22000, estado: "inactivo", esSemillero: false, geometria: PARCEL_GEO["parcela-4"], createdAt: ts(2025, 1, 18), updatedAt: ts(2025, 1, 18) },
  { id: "parcela-5", ranchoId: "rancho-3", identificador: "L-01", superficieM2: 25000, estado: "activo", esSemillero: false, geometria: PARCEL_GEO["parcela-5"], createdAt: ts(2025, 1, 19), updatedAt: ts(2025, 1, 19) },
  { id: "parcela-6", ranchoId: "rancho-3", identificador: "L-02", superficieM2: 12000, estado: "inactivo", esSemillero: true, geometria: PARCEL_GEO["parcela-6"], createdAt: ts(2025, 1, 19), updatedAt: ts(2025, 1, 19) },
]

const plantillas = [
  { id: "plantilla-1", parcelaId: "parcela-1", numero: "T-01", superficieM2: 6000, createdAt: ts(2025, 1, 20), updatedAt: ts(2025, 1, 20) },
  { id: "plantilla-2", parcelaId: "parcela-1", numero: "T-02", superficieM2: 5000, createdAt: ts(2025, 1, 20), updatedAt: ts(2025, 1, 20) },
  { id: "plantilla-3", parcelaId: "parcela-3", numero: "T-01", superficieM2: 6000, createdAt: ts(2025, 1, 21), updatedAt: ts(2025, 1, 21) },
  { id: "plantilla-4", parcelaId: "parcela-3", numero: "T-02", superficieM2: 5500, createdAt: ts(2025, 1, 22), updatedAt: ts(2025, 1, 22) },
  { id: "plantilla-5", parcelaId: "parcela-4", numero: "T-01", superficieM2: 7000, createdAt: ts(2025, 1, 23), updatedAt: ts(2025, 1, 23) },
  { id: "plantilla-6", parcelaId: "parcela-5", numero: "T-01", superficieM2: 8000, createdAt: ts(2025, 1, 24), updatedAt: ts(2025, 1, 24) },
  { id: "plantilla-7", parcelaId: "parcela-5", numero: "T-02", superficieM2: 7500, createdAt: ts(2025, 1, 24), updatedAt: ts(2025, 1, 24) },
  { id: "plantilla-8", parcelaId: "parcela-4", numero: "T-02", superficieM2: 6500, createdAt: ts(2025, 1, 25), updatedAt: ts(2025, 1, 25) },
]

const ciclos = [
  { id: "ciclo-1", parcelaId: "parcela-1", fechaInicio: "2025-02-01", fechaCosechaEstimada: "2026-06-01", estado: "cosechado", createdAt: ts(2025, 2, 1), updatedAt: ts(2025, 2, 1) },
  { id: "ciclo-2", parcelaId: "parcela-3", fechaInicio: "2025-03-01", fechaCosechaEstimada: "2026-07-01", estado: "planeado", createdAt: ts(2025, 3, 1), updatedAt: ts(2025, 3, 1) },
  { id: "ciclo-3", parcelaId: "parcela-1", fechaInicio: "2025-08-01", fechaCosechaEstimada: "2026-11-01", estado: "activo", createdAt: ts(2025, 8, 1), updatedAt: ts(2025, 8, 1) },
  { id: "ciclo-4", parcelaId: "parcela-4", fechaInicio: "2025-05-01", fechaCosechaEstimada: "2026-09-01", estado: "activo", createdAt: ts(2025, 5, 1), updatedAt: ts(2025, 5, 1) },
  { id: "ciclo-5", parcelaId: "parcela-5", fechaInicio: "2025-06-01", fechaCosechaEstimada: "2026-10-01", estado: "activo", createdAt: ts(2025, 6, 1), updatedAt: ts(2025, 6, 1) },
  { id: "ciclo-6", parcelaId: "parcela-3", fechaInicio: "2025-02-15", fechaCosechaEstimada: "2026-05-15", estado: "cosechado", createdAt: ts(2025, 2, 15), updatedAt: ts(2025, 2, 15) },
  { id: "ciclo-7", parcelaId: "parcela-4", fechaInicio: "2025-01-20", fechaCosechaEstimada: "2026-03-20", estado: "cerrado", createdAt: ts(2025, 1, 20), updatedAt: ts(2025, 1, 20) },
]

const actividades = [
  { id: "actividad-1", nombre: "Siembra", descripcion: "Colocación de plantas en campo", createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
  { id: "actividad-2", nombre: "Deshierbe", descripcion: "Eliminación de maleza", createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
  { id: "actividad-3", nombre: "Fumigación", descripcion: "Aplicación de productos", createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
  { id: "actividad-4", nombre: "Croquis", descripcion: "Trazado de plantilla", createdAt: ts(2025, 1, 6), updatedAt: ts(2025, 1, 6) },
  { id: "actividad-5", nombre: "Limpieza", descripcion: "Limpieza de parcela", createdAt: ts(2025, 1, 6), updatedAt: ts(2025, 1, 6) },
  { id: "actividad-6", nombre: "Preparación de tierra", descripcion: "Subsoleo y rastreo", createdAt: ts(2025, 1, 6), updatedAt: ts(2025, 1, 6) },
  { id: "actividad-7", nombre: "Riego", descripcion: "Riego por goteo", createdAt: ts(2025, 1, 7), updatedAt: ts(2025, 1, 7) },
  { id: "actividad-8", nombre: "Cosecha", descripcion: "Corte y acarreo de fruta", createdAt: ts(2025, 1, 7), updatedAt: ts(2025, 1, 7) },
]

const products = [
  { id: "producto-1", ingredienteActivo: "Glifosato", nombreComercial: "Faena", presentacion: "Bidón 20 L", unidadMedida: "litro", cost: 280 },
  { id: "producto-2", ingredienteActivo: "Urea 46%", nombreComercial: "UreaMax", presentacion: "Saco 50 kg", unidadMedida: "kilogramo", cost: 22 },
  { id: "producto-3", ingredienteActivo: "Mancozeb", nombreComercial: "Dithane", presentacion: "Bolsa 1 kg", unidadMedida: "kilogramo", cost: 140 },
  { id: "producto-4", ingredienteActivo: "NPK 12-24-12", nombreComercial: "Nitrofoska", presentacion: "Saco 50 kg", unidadMedida: "kilogramo", cost: 30 },
  { id: "producto-5", ingredienteActivo: "Clorpirifos", nombreComercial: "Lorsban", presentacion: "Bidón 5 L", unidadMedida: "litro", cost: 320 },
  { id: "producto-6", ingredienteActivo: "Nonil fenol", nombreComercial: "Adherente Maxx", presentacion: "Bidón 5 L", unidadMedida: "litro", cost: 95 },
  { id: "producto-7", ingredienteActivo: "Sulfato de potasio", nombreComercial: "SOP-K", presentacion: "Saco 25 kg", unidadMedida: "kilogramo", cost: 28 },
  { id: "producto-8", ingredienteActivo: "Fosfato monoamónico", nombreComercial: "MAP-11", presentacion: "Saco 50 kg", unidadMedida: "kilogramo", cost: 35 },
  { id: "producto-9", ingredienteActivo: "Óxido de cobre", nombreComercial: "Nordox", presentacion: "Bolsa 1 kg", unidadMedida: "kilogramo", cost: 210 },
  { id: "producto-10", ingredienteActivo: "Fertilizante foliar", nombreComercial: "Bayfolan", presentacion: "Bidón 10 L", unidadMedida: "litro", cost: 120 },
  { id: "producto-11", ingredienteActivo: "Carbonato de calcio", nombreComercial: "Cal Agrícola", presentacion: "Saco 40 kg", unidadMedida: "kilogramo", cost: 6 },
  { id: "producto-12", ingredienteActivo: "Diésel", nombreComercial: "Diésel Pemex", presentacion: "Tambo 200 L", unidadMedida: "litro", cost: 24 },
]
const productById = Object.fromEntries(products.map((p) => [p.id, p]))
const productosOut = products.map(({ cost, ...p }) => ({ ...p, createdAt: ts(2025, 1, 8), updatedAt: ts(2025, 1, 8) }))

const proveedores = [
  { id: "proveedor-1", razonSocial: "Agroquímicos del Golfo S.A.", contacto: "Luis Martínez", telefonoPrincipal: "229-111-2233", telefonoSecundario: "229-111-2234", whatsapp: "229-555-1122", email: "ventas@agrogolfo.mx", createdAt: ts(2025, 1, 3), updatedAt: ts(2025, 1, 3) },
  { id: "proveedor-2", razonSocial: "Insumos Agrícolas del Sur", contacto: "María López", telefonoPrincipal: "271-222-3344", telefonoSecundario: "", whatsapp: "271-555-3344", email: "contacto@iasur.mx", createdAt: ts(2025, 1, 4), updatedAt: ts(2025, 1, 4) },
  { id: "proveedor-3", razonSocial: "Fertilizantes del Papaloapan", contacto: "Jorge Ramírez", telefonoPrincipal: "287-333-4455", telefonoSecundario: "", whatsapp: "287-555-4455", email: "ventas@fertipapaloapan.mx", createdAt: ts(2025, 1, 5), updatedAt: ts(2025, 1, 5) },
  { id: "proveedor-4", razonSocial: "Maquinaria y Riego del Trópico", contacto: "Ana Cruz", telefonoPrincipal: "228-444-5566", telefonoSecundario: "", whatsapp: "228-555-5566", email: "ventas@riegotropico.mx", createdAt: ts(2025, 1, 6), updatedAt: ts(2025, 1, 6) },
  { id: "proveedor-5", razonSocial: "Combustibles La Cuenca", contacto: "Pedro Solís", telefonoPrincipal: "294-555-6677", telefonoSecundario: "", whatsapp: "294-555-6678", email: "ventas@combucuenca.mx", createdAt: ts(2025, 1, 7), updatedAt: ts(2025, 1, 7) },
]
const proveedorIds = proveedores.map((p) => p.id)

const semilleros = [
  { id: "semillero-1", parcelaId: "parcela-2", fechaProduccion: "2025-01-30", costoManoObra: 15000, costoInsumos: 8000, costoMaquinaria: 5000, plantasProducidas: 22400, createdAt: ts(2025, 1, 30), updatedAt: ts(2025, 1, 30) },
  { id: "semillero-2", parcelaId: "parcela-6", fechaProduccion: "2025-05-20", costoManoObra: 21000, costoInsumos: 9500, costoMaquinaria: 7200, plantasProducidas: 28000, createdAt: ts(2025, 5, 20), updatedAt: ts(2025, 5, 20) },
  { id: "semillero-3", parcelaId: "parcela-2", fechaProduccion: "2025-09-12", costoManoObra: 18500, costoInsumos: 7400, costoMaquinaria: 6100, plantasProducidas: 25500, createdAt: ts(2025, 9, 12), updatedAt: ts(2025, 9, 12) },
  { id: "semillero-4", parcelaId: "parcela-6", fechaProduccion: "2026-02-08", costoManoObra: 23500, costoInsumos: 11200, costoMaquinaria: 8400, plantasProducidas: 31000, createdAt: ts(2026, 2, 8), updatedAt: ts(2026, 2, 8) },
]

const responsables = ["Cuadrilla A", "Cuadrilla B", "Cuadrilla C", "Cuadrilla D", "Equipo Riego", "Equipo Sanidad"]
const solicitantes = ["Jefe de Campo", "Supervisor Rancho 1", "Supervisor Rancho 2", "Encargado Semillero"]

// Productive tuples (rancho -> parcela -> plantilla -> ciclo) with valid FKs.
const tuples = [
  { r: "rancho-1", p: "parcela-1", t: "plantilla-1", c: "ciclo-3" },
  { r: "rancho-1", p: "parcela-1", t: "plantilla-2", c: "ciclo-3" },
  { r: "rancho-1", p: "parcela-1", t: "plantilla-1", c: "ciclo-1" },
  { r: "rancho-2", p: "parcela-3", t: "plantilla-3", c: "ciclo-6" },
  { r: "rancho-2", p: "parcela-3", t: "plantilla-4", c: "ciclo-6" },
  { r: "rancho-2", p: "parcela-4", t: "plantilla-5", c: "ciclo-4" },
  { r: "rancho-2", p: "parcela-4", t: "plantilla-8", c: "ciclo-4" },
  { r: "rancho-3", p: "parcela-5", t: "plantilla-6", c: "ciclo-5" },
  { r: "rancho-3", p: "parcela-5", t: "plantilla-7", c: "ciclo-5" },
]

// ---- Transactional data (existing rows kept + generated) --------------------
const registros = [
  { id: "regact-1", fecha: "2025-02-05", actividadId: "actividad-1", ranchoId: "rancho-1", parcelaId: "parcela-1", plantillaId: "plantilla-1", cicloId: "ciclo-1", responsable: "Cuadrilla A", cantidad: 30000, costo: 12000, createdAt: ts(2025, 2, 5), updatedAt: ts(2025, 2, 5) },
  { id: "regact-2", fecha: "2025-03-10", actividadId: "actividad-2", ranchoId: "rancho-1", parcelaId: "parcela-1", plantillaId: "plantilla-1", cicloId: "ciclo-1", responsable: "Cuadrilla B", cantidad: 1, costo: 4500, createdAt: ts(2025, 3, 10), updatedAt: ts(2025, 3, 10) },
]
let regId = 100
for (const { y, m } of months) {
  const n = rnd(3, 5)
  for (let i = 0; i < n; i++) {
    const tup = pick(tuples)
    const act = pick(actividades)
    registros.push({
      id: `regact-${regId++}`, fecha: iso(y, m, rnd(1, 28)), actividadId: act.id,
      ranchoId: tup.r, parcelaId: tup.p, plantillaId: tup.t, cicloId: tup.c,
      responsable: pick(responsables), cantidad: rnd(1, 40), costo: rnd(2500, 20000),
      createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
    })
  }
}

const vales = [
  { id: "vale-1", folio: "VS-001", fecha: "2025-03-12", responsable: "Almacén", ranchoId: "rancho-1", parcelaId: "parcela-1", plantillaId: "plantilla-1", cicloId: "ciclo-1", detalles: [{ productoId: "producto-2", cantidad: 30, costoUnitario: 22 }], createdAt: ts(2025, 3, 12), updatedAt: ts(2025, 3, 12) },
]
let valeId = 100
let folioV = 10
for (const { y, m } of months) {
  const n = rnd(1, 2)
  for (let i = 0; i < n; i++) {
    const tup = pick(tuples)
    const dn = rnd(1, 3)
    const detalles = []
    for (let k = 0; k < dn; k++) {
      const pr = pick(products)
      detalles.push({ productoId: pr.id, cantidad: rnd(5, 60), costoUnitario: Math.round(pr.cost * (0.95 + rng() * 0.1)) })
    }
    vales.push({
      id: `vale-${valeId++}`, folio: `VS-${pad(folioV++)}`, fecha: iso(y, m, rnd(1, 28)),
      responsable: "Almacén", ranchoId: tup.r, parcelaId: tup.p, plantillaId: tup.t, cicloId: tup.c,
      detalles, createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
    })
  }
}

const movimientos = [
  { id: "mov-1", productoId: "producto-2", tipo: "entrada", fecha: "2025-02-10", cantidad: 100, costoUnitario: 22, proveedorId: "proveedor-1", factura: "F-1001", destino: "", createdAt: ts(2025, 2, 10), updatedAt: ts(2025, 2, 10) },
  { id: "mov-2", productoId: "producto-2", tipo: "entrada", fecha: "2025-03-05", cantidad: 50, costoUnitario: 24, proveedorId: "proveedor-1", factura: "F-1042", destino: "", createdAt: ts(2025, 3, 5), updatedAt: ts(2025, 3, 5) },
  { id: "mov-3", productoId: "producto-2", tipo: "salida", fecha: "2025-03-12", cantidad: 30, costoUnitario: 22, proveedorId: "", factura: "", destino: "Ciclo ciclo-1", createdAt: ts(2025, 3, 12), updatedAt: ts(2025, 3, 12) },
]
let movId = 100
let fact = 2000
for (const pr of products) {
  const nE = rnd(3, 6)
  for (let i = 0; i < nE; i++) {
    const { y, m } = pick(months)
    movimientos.push({
      id: `mov-${movId++}`, productoId: pr.id, tipo: "entrada", fecha: iso(y, m, rnd(1, 28)),
      cantidad: pr.cost > 150 ? rnd(20, 120) : rnd(80, 400),
      costoUnitario: Math.round(pr.cost * (0.9 + rng() * 0.2)),
      proveedorId: pick(proveedorIds), factura: `F-${fact++}`, destino: "",
      createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
    })
  }
  const nS = rnd(0, 3)
  for (let i = 0; i < nS; i++) {
    const { y, m } = pick(months)
    movimientos.push({
      id: `mov-${movId++}`, productoId: pr.id, tipo: "salida", fecha: iso(y, m, rnd(1, 28)),
      cantidad: pr.cost > 150 ? rnd(5, 25) : rnd(20, 80), costoUnitario: 0,
      proveedorId: "", factura: "", destino: `Ciclo ${pick(tuples).c}`,
      createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
    })
  }
}

const siembras = [
  { id: "siembra-1", cicloId: "ciclo-1", plantillaId: "plantilla-1", fecha: "2025-02-05", cantidadPlantas: 30000, costoUnitarioPlanta: 1.25, createdAt: ts(2025, 2, 5), updatedAt: ts(2025, 2, 5) },
]
let sieId = 100
const plantTuples = tuples.filter((t) => ["ciclo-1", "ciclo-3", "ciclo-4", "ciclo-5", "ciclo-6"].includes(t.c))
for (const { y, m } of months) {
  if (rng() < 0.7) {
    const n = rnd(1, 2)
    for (let i = 0; i < n; i++) {
      const tup = pick(plantTuples)
      siembras.push({
        id: `siembra-${sieId++}`, cicloId: tup.c, plantillaId: tup.t, fecha: iso(y, m, rnd(1, 28)),
        cantidadPlantas: rnd(8000, 35000), costoUnitarioPlanta: Number((1 + rng() * 0.6).toFixed(2)),
        createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
      })
    }
  }
}

const requerimientos = [
  { id: "req-1", folio: "REQ-001", fecha: "2025-02-08", solicitante: "Jefe de Campo", observaciones: "Para fertilización plantilla T-01", detalles: [{ productoId: "producto-2", cantidad: 100, unidadMedida: "kilogramo" }], createdAt: ts(2025, 2, 8), updatedAt: ts(2025, 2, 8) },
]
const cotizaciones = [
  { id: "cot-1", requerimientoId: "req-1", proveedorId: "proveedor-1", fecha: "2025-02-09", estado: "comprada", detalles: [{ productoId: "producto-2", cantidad: 100, precioUnitario: 22 }], createdAt: ts(2025, 2, 9), updatedAt: ts(2025, 2, 9) },
]
const ordenes = [
  { id: "oc-1", folio: "OC-001", fecha: "2025-02-09", proveedorId: "proveedor-1", estado: "surtida", detalles: [{ productoId: "producto-2", cantidad: 100, precioUnitario: 22 }], createdAt: ts(2025, 2, 9), updatedAt: ts(2025, 2, 9) },
]
const recepciones = [
  { id: "rec-1", ordenCompraId: "oc-1", factura: "F-1001", fecha: "2025-02-10", detalles: [{ productoId: "producto-2", cantidad: 100, costoUnitario: 22 }], createdAt: ts(2025, 2, 10), updatedAt: ts(2025, 2, 10) },
]
const cuentas = [
  { id: "cxp-1", proveedorId: "proveedor-1", factura: "F-1001", importe: 2200, fechaVencimiento: "2025-03-12", estado: "pagada", createdAt: ts(2025, 2, 10), updatedAt: ts(2025, 2, 10) },
]
let rqId = 100, ctId = 100, ocId = 100, rcId = 100, cxId = 100, folioR = 10, folioOC = 10, fac = 3000
for (let i = 0; i < 16; i++) {
  const { y, m } = pick(months)
  const prov = pick(proveedores)
  const dn = rnd(1, 3)
  const det = []
  for (let k = 0; k < dn; k++) {
    const pr = pick(products)
    det.push({ productoId: pr.id, cantidad: rnd(20, 200), precioUnitario: Math.round(pr.cost * (0.95 + rng() * 0.1)) })
  }
  const importe = det.reduce((a, d) => a + d.cantidad * d.precioUnitario, 0)
  const reqId = `req-${rqId++}`
  requerimientos.push({
    id: reqId, folio: `REQ-${pad(folioR)}`, fecha: iso(y, m, rnd(1, 20)), solicitante: pick(solicitantes),
    observaciones: "", detalles: det.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad, unidadMedida: productById[d.productoId].unidadMedida })),
    createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
  })
  cotizaciones.push({
    id: `cot-${ctId++}`, requerimientoId: reqId, proveedorId: prov.id, fecha: iso(y, m, rnd(1, 22)),
    estado: pick(["pendiente", "cotizada", "comprada"]), detalles: det, createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
  })
  const ocEstado = pick(["borrador", "autorizada", "parcial", "surtida", "surtida", "cancelada"])
  const ocId2 = `oc-${ocId++}`
  ordenes.push({
    id: ocId2, folio: `OC-${pad(folioOC)}`, fecha: iso(y, m, rnd(1, 24)), proveedorId: prov.id,
    estado: ocEstado, detalles: det, createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
  })
  if (ocEstado === "surtida" || ocEstado === "parcial") {
    const factura = `F-${fac++}`
    recepciones.push({
      id: `rec-${rcId++}`, ordenCompraId: ocId2, factura, fecha: iso(y, m, rnd(2, 26)),
      detalles: det.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad, costoUnitario: d.precioUnitario })),
      createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
    })
    const vy = m === 12 ? y + 1 : y
    const vm = m === 12 ? 1 : m + 1
    cuentas.push({
      id: `cxp-${cxId++}`, proveedorId: prov.id, factura, importe, fechaVencimiento: iso(vy, vm, rnd(1, 28)),
      estado: pick(["pendiente", "pagada", "vencida"]), createdAt: ts(y, m, 1), updatedAt: ts(y, m, 1),
    })
  }
  folioR++
  folioOC++
}

const db = {
  ranchos, parcelas, plantillas, ciclos, siembras, semilleros, actividades,
  registrosActividad: registros, productos: productosOut, proveedores,
  movimientosInventario: movimientos, requerimientos, cotizaciones,
  ordenesCompra: ordenes, recepciones, cuentasPorPagar: cuentas, valesSalida: vales,
}

const out = JSON.stringify(db, null, 2)
writeFileSync(path.join(process.cwd(), ".data", "database.json"), out)
writeFileSync(path.join(process.cwd(), "src", "infrastructure", "persistence", "seed.json"), out)

const counts = Object.fromEntries(Object.entries(db).map(([k, v]) => [k, v.length]))
console.log("Seed written. Counts:", JSON.stringify(counts))
