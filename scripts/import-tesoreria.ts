import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import XLSX from "xlsx"
import * as schema from "@/infrastructure/persistence/sql/schema"
import { generateId, nowDate } from "@/infrastructure/persistence/sql/util"

const ARCHIVO = "scripts/data/control-ingresos-egresos-2025.xlsx"

type TipoCuenta = "banco" | "efectivo" | "persona" | "reserva"

const CUENTAS: { hoja: string; tipo: TipoCuenta; moneda: string }[] = [
  { hoja: "MGZ121", tipo: "banco", moneda: "MXN" },
  { hoja: "MGZ BBVA", tipo: "banco", moneda: "MXN" },
  { hoja: "MGZ DOLARES", tipo: "banco", moneda: "USD" },
  { hoja: "MGZ BAJIO", tipo: "banco", moneda: "MXN" },
  { hoja: "VICTOR BANAMEX", tipo: "banco", moneda: "MXN" },
  { hoja: "VICTOR BANORTE", tipo: "banco", moneda: "MXN" },
  { hoja: "RODRIGO", tipo: "persona", moneda: "MXN" },
  { hoja: "MOY", tipo: "persona", moneda: "MXN" },
  { hoja: "NORMA RUTH", tipo: "persona", moneda: "MXN" },
  { hoja: "VALERIA", tipo: "persona", moneda: "MXN" },
  { hoja: "MANUEL BANAMEX", tipo: "persona", moneda: "MXN" },
  { hoja: "ROBERTO", tipo: "persona", moneda: "MXN" },
  { hoja: "JUAN", tipo: "persona", moneda: "MXN" },
  { hoja: "NORMA SANCHEZ", tipo: "persona", moneda: "MXN" },
  { hoja: "JOSE CARLOS", tipo: "persona", moneda: "MXN" },
  { hoja: "LUIS ENRIQUE ", tipo: "persona", moneda: "MXN" },
  { hoja: "CESARIA", tipo: "persona", moneda: "MXN" },
  { hoja: "ALAN", tipo: "persona", moneda: "MXN" },
  { hoja: "ELVIA", tipo: "persona", moneda: "MXN" },
  { hoja: "CAJA", tipo: "efectivo", moneda: "MXN" },
  { hoja: "CAJA TIGRES", tipo: "efectivo", moneda: "MXN" },
  { hoja: "RESERVA", tipo: "reserva", moneda: "MXN" },
]

// Taxonomía verificada fila por fila contra la hoja ENE25 del Excel.
// [nombre, tipo, padre|null, orden]
const CATEGORIAS: [string, "ingreso" | "egreso", string | null, number][] = [
  ["VENTA PIÑAS", "ingreso", null, 1],
  ["VENTA GANADO", "ingreso", null, 2],
  ["OTROS INGRESOS", "ingreso", null, 3],
  ["CABALLOS", "ingreso", null, 4],
  ["PRODUCTOS FINANCIEROS", "ingreso", null, 5],
  ["REMESAS", "ingreso", null, 6],
  ["REEMBOLSO", "ingreso", null, 7],
  ["VENTA EXTERNA", "ingreso", null, 8],
  ["VENTA POMELERO", "ingreso", null, 9],

  ["RAYA", "egreso", null, 10],
  ["RAYA MGZ", "egreso", "RAYA", 11],
  ["ANTICIPOS RAYA MGZ", "egreso", "RAYA", 12],
  ["RAYA GANADERIA", "egreso", "RAYA", 13],

  ["PRODUCCION", "egreso", null, 14],
  ["FERTILIZANTES Y AGROQUIMICOS", "egreso", "PRODUCCION", 15],
  ["ACOLCHADO PLASTICO", "egreso", "PRODUCCION", 16],
  ["MALLA SOMBRA", "egreso", "PRODUCCION", 17],
  ["CORTES Y FLETES", "egreso", "PRODUCCION", 18],
  ["COMPRA DE PIÑAS", "egreso", "PRODUCCION", 19],
  ["CORTES POMELERO", "egreso", "PRODUCCION", 20],
  ["PRESTAMO CHOFER", "egreso", "PRODUCCION", 21],

  ["OPERACION", "egreso", null, 22],
  ["SERVICIOS MECANICOS", "egreso", "OPERACION", 23],
  ["REFACCIONES MAQUINARIA Y VEHICULOS", "egreso", "OPERACION", 24],
  ["COMBUSTIBLE", "egreso", "OPERACION", 25],
  ["MATERIALES VARIOS", "egreso", "OPERACION", 26],
  ["GANADERIA", "egreso", "OPERACION", 27],
  ["RIEGO Y POZOS", "egreso", "OPERACION", 28],
  ["ENERGIA ELECTRICA, AGUA, GAS Y OXIGENO GRUPOS", "egreso", "OPERACION", 29],
  ["TELEFONOS", "egreso", "OPERACION", 30],
  ["VARIOS OPERACIÓN", "egreso", "OPERACION", 31],
  ["TENENCIAS", "egreso", "OPERACION", 32],
  ["SEGUROS CAMPO", "egreso", "OPERACION", 33],
  ["MMTO EQUIPOS ", "egreso", "OPERACION", 34],
  ["LLANTAS Y SERVICIOS ALINEACION-BALANCEO", "egreso", "OPERACION", 35],
  ["LAVADO Y ENGRASADO VEHICULOS", "egreso", "OPERACION", 36],
  ["RENTA TIERRAS", "egreso", "OPERACION", 37],
  ["ARRENDAMIENTO OFICINA/BODEGA", "egreso", "OPERACION", 38],
  ["MTTO INSTALACIONES", "egreso", "OPERACION", 39],
  ["DESCARGA DE PRODUCTOS", "egreso", "OPERACION", 40],
  ["PERDIDA EN VENTA FRUTA", "egreso", "OPERACION", 41],

  ["ADMINISTRATIVO", "egreso", null, 42],
  ["ASESORIAS", "egreso", "ADMINISTRATIVO", 43],
  ["SIPARE/IMSS", "egreso", "ADMINISTRATIVO", 44],
  ["IMPUESTO ESTATAL", "egreso", "ADMINISTRATIVO", 45],
  ["TELEFONOS/INTERNET", "egreso", "ADMINISTRATIVO", 46],
  ["LUZ/AGUA", "egreso", "ADMINISTRATIVO", 47],
  ["VARIOS ADMINISTRACION", "egreso", "ADMINISTRATIVO", 48],
  ["MTTO EQUIPO DE OFICINA", "egreso", "ADMINISTRATIVO", 49],
  ["ARRENDAMIENTO OFICINA", "egreso", "ADMINISTRATIVO", 50],
  ["VIATICOS", "egreso", "ADMINISTRATIVO", 51],
  ["LAVADO Y ENGRASADO VEHICULOS ADMTVO", "egreso", "ADMINISTRATIVO", 52],

  ["FINANCIERO", "egreso", null, 53],
  ["COMISION BANCARIA", "egreso", "FINANCIERO", 54],
  ["INTERES BANCARIO", "egreso", "FINANCIERO", 55],
  ["INTERES EXTERNO", "egreso", "FINANCIERO", 56],

  ["ACTIVOS", "egreso", null, 57],
  ["VEHICULOS TRABAJO", "egreso", "ACTIVOS", 58],
  ["TERRENOS", "egreso", "ACTIVOS", 59],
  ["AIRE ACONDICIONADO", "egreso", "ACTIVOS", 60],
  ["EQUIPOS DIVERSOS", "egreso", "ACTIVOS", 61],

  ["IMPUESTOS RAIZ", "egreso", null, 62],
  ["IMPUESTOS", "egreso", "IMPUESTOS RAIZ", 63],

  ["EXTERNA", "egreso", null, 64],
  ["DEV. VENTA EXTERNA", "egreso", "EXTERNA", 65],

  ["PRESTAMOS", "egreso", null, 66],
  ["BANCARIOS", "egreso", "PRESTAMOS", 67],
  ["EXTERNOS", "egreso", "PRESTAMOS", 68],
  ["TRABAJADORES", "egreso", "PRESTAMOS", 69],
  ["SOCIOS", "egreso", "PRESTAMOS", 70],

  ["TRASPASO", "egreso", null, 71],
  ["TRASPASO MGZ121", "egreso", "TRASPASO", 72],
  ["TRASPASO MGZBBVA", "egreso", "TRASPASO", 73],
  ["TRASPASO MGZ DOLARES", "egreso", "TRASPASO", 74],
  ["TRASPASO MGZ BAJIO", "egreso", "TRASPASO", 75],
  ["TRASPASO VICTOR BANAMEX", "egreso", "TRASPASO", 76],
  ["TRASPASO VICTOR BANORTE", "egreso", "TRASPASO", 77],
  ["TRASPASO VICTOR BANCOMER", "egreso", "TRASPASO", 78],
  ["TRASPASO RODRIGO", "egreso", "TRASPASO", 79],
  ["TRASPASO MOY", "egreso", "TRASPASO", 80],
  ["TRASPASO NORMA RUTH", "egreso", "TRASPASO", 81],
  ["TRASPASO VALERIA", "egreso", "TRASPASO", 82],
  ["TRASPASO MANUEL BANAMEX", "egreso", "TRASPASO", 83],
  ["TRASPASO ROBERTO", "egreso", "TRASPASO", 84],
  ["TRASPASO LUIS ENRIQUE ", "egreso", "TRASPASO", 85],
  ["TRASPASO PEDRO C", "egreso", "TRASPASO", 86],
  ["TRASPASO JUAN", "egreso", "TRASPASO", 87],
  ["TRASPASO NORMA SANCHEZ", "egreso", "TRASPASO", 88],
  ["TRASPASO JOSE CARLOS", "egreso", "TRASPASO", 89],
  ["TRASPASO CESARIA", "egreso", "TRASPASO", 90],
  ["TRASPASO ALAN", "egreso", "TRASPASO", 91],
  ["TRASPASO ELVIA", "egreso", "TRASPASO", 92],
  ["TRASPASO CAJA", "egreso", "TRASPASO", 93],
  ["TRASPASO CAJA TIGRES", "egreso", "TRASPASO", 94],
  ["RESERVAS", "egreso", "TRASPASO", 95],

  ["PERSONALES", "egreso", null, 96],
  ["VICTOR", "egreso", "PERSONALES", 97],
  ["NORMA", "egreso", "PERSONALES", 98],
  ["RODRIGO PERSONAL", "egreso", "PERSONALES", 99],
  ["MOISES", "egreso", "PERSONALES", 100],
  ["VALERIA PERSONAL", "egreso", "PERSONALES", 101],
  ["FUTBOL/BEISBOL", "egreso", "PERSONALES", 102],
  ["CABALLOS PERSONAL", "egreso", "PERSONALES", 103],

  ["FAMILIAS", "egreso", null, 104],
  ["APOYO FAMILIA", "egreso", "FAMILIAS", 105],
  ["APOYO TERCEROS", "egreso", "FAMILIAS", 106],
  ["PAGOS FAMILIA", "egreso", "FAMILIAS", 107],
  ["SEGUROS Y BECAS", "egreso", "FAMILIAS", 108],
  ["PRESTAMO CASA CORDOVA", "egreso", "FAMILIAS", 109],
  ["SEGURO CASA CORDOVA", "egreso", "FAMILIAS", 110],
  ["INTERES CASA CORDOVA", "egreso", "FAMILIAS", 111],
  ["VEHICULOS PERSONALES", "egreso", "FAMILIAS", 112],
]

// El Excel usa el mismo texto "RODRIGO"/"VALERIA"/"CABALLOS" para una
// cuenta o categoría raíz de ingreso Y para una subcategoría de PERSONALES.
// Se renombran las hojas de PERSONALES en el import (columna J del ledger
// sigue diciendo "RODRIGO" tal cual — el mapeo de texto→categoría de abajo
// traduce explícitamente esos 3 casos ambiguos al nombre "renombrado").
const ALIAS_CONCEPTO: Record<string, string> = {
  RODRIGO: "RODRIGO PERSONAL",
  VALERIA: "VALERIA PERSONAL",
  CABALLOS: "CABALLOS PERSONAL",
}

function normaliza(texto: string): string {
  return texto.trim().toUpperCase()
}

function excelFechaAISO(valor: unknown): string {
  if (valor instanceof Date) return valor.toISOString()
  return new Date(String(valor)).toISOString()
}

/**
 * Corrección de una errata real en el Excel fuente: la hoja ALAN, fila 26,
 * tiene "31-Mar-05" en vez de "31-Mar-25" (transposición de dígitos) para
 * un cargo de "COMISION MANEJO DE CUENTA" — confirmado comparando con la
 * fila siguiente (mismo concepto, fecha correcta "31-Mar-25"). Sin esta
 * corrección, la fecha caería en el año 2005 y se contaría erróneamente
 * como anterior a cualquier corte de reconciliación.
 */
function corrigeErrataFecha(iso: string, hoja: string, folio: string): string {
  if (hoja === "ALAN" && folio === "10429762" && iso.startsWith("2005-03-31")) {
    return iso.replace("2005-03-31", "2025-03-31")
  }
  return iso
}

function monto(valor: unknown): number {
  const limpio = String(valor ?? "0").replace(/[$,\s]/g, "")
  const n = Number.parseFloat(limpio)
  return Number.isNaN(n) ? 0 : n
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })
  const now = nowDate()

  const wb = XLSX.readFile(ARCHIVO, { cellDates: true, raw: false })

  // 1. Categorías (padres antes que hijos).
  const idPorNombreCategoria = new Map<string, string>()
  const raices = CATEGORIAS.filter(([, , padre]) => padre === null)
  const hijos = CATEGORIAS.filter(([, , padre]) => padre !== null)
  const filasCategorias: (typeof schema.categorias.$inferInsert)[] = []
  for (const [nombre, tipo, , orden] of raices) {
    const id = generateId("categorias")
    idPorNombreCategoria.set(nombre, id)
    filasCategorias.push({
      id, nombre, tipo, parentId: null, orden, estado: "activo",
      createdAt: now, updatedAt: now,
    })
  }
  for (const [nombre, tipo, padre, orden] of hijos) {
    const id = generateId("categorias")
    idPorNombreCategoria.set(nombre, id)
    filasCategorias.push({
      id, nombre, tipo, parentId: idPorNombreCategoria.get(padre!) ?? null,
      orden, estado: "activo", createdAt: now, updatedAt: now,
    })
  }
  await db.insert(schema.categorias).values(filasCategorias)
  console.log(`Categorías importadas: ${filasCategorias.length}`)

  // Índice CONCEPTO normalizado -> { ingreso?: id, egreso?: id } (solo hojas).
  const hojasCategoria = new Set(hijos.map(([nombre]) => nombre))
  for (const [nombre] of raices) {
    // Una raíz sin hijos declarados en CATEGORIAS también es hoja (ingresos).
    if (!hijos.some(([, , padre]) => padre === nombre)) hojasCategoria.add(nombre)
  }
  const lookupCategoria = new Map<string, { ingreso?: string; egreso?: string }>()
  for (const [nombre, tipo] of CATEGORIAS) {
    if (!hojasCategoria.has(nombre)) continue
    const clave = normaliza(nombre)
    const entrada = lookupCategoria.get(clave) ?? {}
    entrada[tipo] = idPorNombreCategoria.get(nombre)
    lookupCategoria.set(clave, entrada)
  }

  // Algunas categorías hoja (TRASPASO *, y PRESTAMOS > BANCARIOS/EXTERNOS/
  // TRABAJADORES/SOCIOS) están declaradas arriba solo como "egreso". En el
  // Excel real, el mismo CONCEPTO también aparece del lado ENTRADA (p.ej.
  // "TRASPASO MGZ121" es la salida en la cuenta origen Y la entrada en la
  // cuenta destino del mismo traspaso; un préstamo recibido es ENTRADA con
  // CONCEPTO "SOCIOS"/"BANCARIOS"/etc.) — el propio Excel modela esto con
  // bloques ENTRADA/SALIDA separados (dos SUMIFS por nombre) en su matriz
  // mensual, es decir SÍ son categorías bidireccionales en el negocio real,
  // pero nuestra taxonomía (CATEGORIAS arriba) todavía solo define el lado
  // egreso para ellas.
  //
  // Por eso esta función NO hace fallback al tipo contrario cuando la
  // dirección propia de la fila no tiene id: hacerlo mezclaría movimientos
  // de tipo "entrada" dentro de categorías tipo "egreso", lo cual rompe en
  // silencio el filtro estricto `direccion === direccionEsperada[categoria.tipo]`
  // de calcularMatrizMensual (Task 5) — esas filas simplemente desaparecerían
  // de la matriz mensual sin que "sin categoría resuelta" las marcara (el
  // categoriaId no sería null, solo del tipo equivocado). Esas ~1,376 filas
  // ENTRADA de traspasos/préstamos quedan con categoriaId = null: el dinero
  // se importa correctamente (direccion/monto/cuentaId íntegros, por lo que
  // calcularSaldo y la reconciliación de saldos no se ven afectados), solo
  // falta extender la taxonomía con el lado ingreso de estas categorías en
  // un futuro paso para que aparezcan en el desglose de la matriz mensual.
  function resuelveCategoriaId(conceptoCrudo: string, direccion: "entrada" | "salida"): string {
    const concepto = ALIAS_CONCEPTO[normaliza(conceptoCrudo)] ?? conceptoCrudo
    const clave = normaliza(concepto)
    const entrada = lookupCategoria.get(clave)
    if (!entrada) return ""
    return (direccion === "entrada" ? entrada.ingreso : entrada.egreso) ?? ""
  }

  // 2. Cuentas.
  const idPorCuenta = new Map<string, string>()
  const filasCuentas: (typeof schema.cuentas.$inferInsert)[] = []
  for (const { hoja, tipo, moneda } of CUENTAS) {
    const ws = wb.Sheets[hoja]
    if (!ws) throw new Error(`No se encontró la hoja "${hoja}" en el Excel.`)
    const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" })
    const saldoInicial = monto((filas[1] as unknown[])?.[14]) // columna O = SALDO
    const id = generateId("cuentas")
    idPorCuenta.set(hoja, id)
    filasCuentas.push({
      id, nombre: hoja.trim(), tipo, moneda, saldoInicial, estado: "activo",
      createdAt: now, updatedAt: now,
    })
  }
  await db.insert(schema.cuentas).values(filasCuentas)
  console.log(`Cuentas importadas: ${filasCuentas.length}`)

  // 3. Movimientos (todas las filas de datos de cada ledger, desde la fila 3
  // en adelante — la fila 2 es el SALDO INICIAL, ya capturado en cuentas.saldoInicial).
  let totalMovimientos = 0
  let sinCategoria = 0
  for (const { hoja } of CUENTAS) {
    const ws = wb.Sheets[hoja]
    const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" })
    const cuentaId = idPorCuenta.get(hoja)!
    const filasMovimiento: (typeof schema.movimientos.$inferInsert)[] = []

    for (let i = 2; i < filas.length; i++) {
      const fila = filas[i] as unknown[]
      const fecha = fila[0]
      const tipoFila = String(fila[7] ?? "").trim().toUpperCase()
      if (!fecha || (tipoFila !== "ENTRADA" && tipoFila !== "SALIDA")) continue

      const direccion = tipoFila === "ENTRADA" ? "entrada" : "salida"
      const concepto = String(fila[9] ?? "").trim()
      const montoFila = monto(direccion === "entrada" ? fila[12] : fila[13])
      if (montoFila === 0) continue

      const categoriaId = resuelveCategoriaId(concepto, direccion)
      if (!categoriaId) sinCategoria++

      filasMovimiento.push({
        id: generateId("movimientos"),
        cuentaId,
        fecha: new Date(corrigeErrataFecha(excelFechaAISO(fecha), hoja, String(fila[2] ?? ""))),
        direccion,
        categoriaId: categoriaId || null,
        monto: montoFila,
        beneficiario: String(fila[10] ?? "") || null,
        referencia: String(fila[11] ?? "") || null,
        folio: String(fila[2] ?? "") || null,
        descripcion: String(fila[4] ?? "") || null,
        traspasoId: null,
        creadoPor: null,
        createdAt: now,
        updatedAt: now,
      })
    }

    if (filasMovimiento.length > 0) {
      // Insertar en lotes de 500 (postgres tiene límite de parámetros por query).
      for (let i = 0; i < filasMovimiento.length; i += 500) {
        await db.insert(schema.movimientos).values(filasMovimiento.slice(i, i + 500))
      }
    }
    totalMovimientos += filasMovimiento.length
    console.log(`  ${hoja}: ${filasMovimiento.length} movimientos`)
  }

  console.log(`Total movimientos importados: ${totalMovimientos}`)
  console.log(`Movimientos sin categoría resuelta (categoriaId null): ${sinCategoria}`)
  console.log(
    "  (esperado: >0 — estas filas corresponden a traspasos/préstamos de entrada; " +
      "la taxonomía actual solo modela el lado egreso de esas categorías, fiel al " +
      "patrón del Excel origen, que las trata como bloques ENTRADA/SALIDA separados. " +
      "Quedan importadas con saldo correcto (direccion/monto/cuentaId íntegros) pero " +
      "sin categoría en la matriz mensual, pendiente de extender la taxonomía en un " +
      "futuro paso.)",
  )

  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
