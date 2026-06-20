import "dotenv/config"
import postgres from "postgres"
import type {
  CollectionName,
  MovimientoInventario,
  Producto,
  Rancho,
  Requerimiento,
} from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import {
  analyticsService,
  costingService,
  crudService,
  inventoryService,
  repository,
  traceabilityService,
} from "@/infrastructure/container"
import { loadParcelasMapa } from "@/presentation/geo-queries"
import {
  loadLabelMap,
  loadRecords,
  loadReferenceOptions,
} from "@/presentation/queries"
import { MODULES } from "@/presentation/config/modules"

const EXPECTED: Record<string, number> = {
  ranchos: 3,
  parcelas: 7,
  plantillas: 8,
  ciclos: 7,
  siembras: 25,
  semilleros: 4,
  actividades: 8,
  registrosActividad: 73,
  productos: 12,
  proveedores: 5,
  movimientosInventario: 66,
  requerimientos: 17,
  cotizaciones: 17,
  ordenesCompra: 17,
  recepciones: 10,
  cuentasPorPagar: 10,
  valesSalida: 29,
}
const AGG: CollectionName[] = [
  "requerimientos",
  "cotizaciones",
  "ordenesCompra",
  "recepciones",
  "valesSalida",
]
const COLLECTIONS = Object.keys(EXPECTED) as CollectionName[]
const driver = process.env.DB_DRIVER ?? "sql"
const round = (n: number) => Number(n.toFixed(2))
const byId = <T extends { id: string }>(rows: T[]) =>
  [...rows].sort((a, b) => a.id.localeCompare(b.id))

let failures = 0
const fp: Record<string, unknown> = {}
function ok(name: string, cond: boolean, detail = "") {
  if (!cond) {
    failures++
    console.log(`  FAIL: ${name} ${detail}`)
  }
}

async function reads() {
  // 1. Counts: count(), findAll().length, crudService.list() all agree.
  for (const c of COLLECTIONS) {
    const repo = repository(c)
    const [cnt, all, list] = await Promise.all([
      repo.count(),
      repo.findAll(),
      crudService(c).list(),
    ])
    ok(`count ${c}`, cnt === EXPECTED[c], `got ${cnt} want ${EXPECTED[c]}`)
    ok(`findAll ${c}`, all.length === EXPECTED[c], `got ${all.length}`)
    ok(`list ${c}`, list.length === EXPECTED[c], `got ${list.length}`)
  }

  // 2. findById round-trip + crudService.get + NotFound on bad id.
  for (const c of COLLECTIONS) {
    const all = byId(await repository(c).findAll())
    const first = all[0]
    const got = await repository(c).findById(first.id)
    ok(`findById ${c}`, !!got && got.id === first.id)
    const viaSvc = await crudService(c).get(first.id)
    ok(`get ${c}`, viaSvc.id === first.id)
    const missing = await repository(c).findById("__nope__")
    ok(`findById miss ${c}`, missing === null)
  }
  let threw = false
  try {
    await crudService("ranchos").get("__nope__")
  } catch (e) {
    threw = e instanceof NotFoundError
  }
  ok("get throws NotFoundError", threw)

  // 3. findBy equality.
  const movsRepo = repository<MovimientoInventario>("movimientosInventario")
  const movs = await movsRepo.findAll()
  const pid = movs[0].productoId
  const byProd = await movsRepo.findBy({ productoId: pid })
  ok(
    "findBy productoId",
    byProd.length > 0 && byProd.every((m) => m.productoId === pid),
  )
  const none = await movsRepo.findBy({ productoId: "__nope__" })
  ok("findBy no-match", none.length === 0)
  const tipo = movs[0].tipo
  const two = await movsRepo.findBy({ productoId: pid, tipo })
  ok(
    "findBy two keys",
    two.every((m) => m.productoId === pid && m.tipo === tipo),
  )

  // 4. Aggregate hydration: detalles present + line counts + findById hydrates.
  let totalLines = 0
  for (const c of AGG) {
    const rows = (await repository(c).findAll()) as unknown as Array<{
      id: string
      detalles: unknown[]
    }>
    const allHave = rows.every((r) => Array.isArray(r.detalles))
    ok(`hydrate ${c}`, allHave)
    const lines = rows.reduce((a, r) => a + r.detalles.length, 0)
    totalLines += lines
    const first = byId(rows)[0]
    const one = (await repository(c).findById(first.id)) as unknown as {
      detalles: unknown[]
    } | null
    ok(
      `findById hydrate ${c}`,
      !!one && one.detalles.length === first.detalles.length,
    )
  }
  fp.totalLines = totalLines

  // 5. Services / compute.
  const productos = byId(await repository<Producto>("productos").findAll())
  const inv = inventoryService()
  const ex = await inv.existencias()
  fp.invTotalExistencia = round(ex.reduce((a, e) => a + e.existencia, 0))
  fp.invTotalValor = round(ex.reduce((a, e) => a + e.valorInventario, 0))
  const kardex = await inv.kardex(productos[0].id)
  fp.kardexFirstLen = kardex.length
  fp.existenciaFirst = round(await inv.existencia(productos[0].id))

  const cost = costingService()
  for (const nivel of [
    "ranchoId",
    "parcelaId",
    "plantillaId",
    "cicloId",
  ] as const) {
    const r = await cost.resumenPorNivel(nivel)
    fp[`costo_${nivel}`] = round(r.reduce((a, x) => a + x.total, 0))
  }
  const semilla = await cost.costoSemilla()
  fp.costoSemillaTotal = round(semilla.reduce((a, s) => a + s.costoTotal, 0))

  const an = analyticsService()
  const cpm = await an.costosPorMes()
  fp.costosPorMes_meses = cpm.length
  fp.costosPorMes_total = round(cpm.reduce((a, p) => a + p.total, 0))
  const ppm = await an.plantasPorMes()
  fp.plantasPorMes_total = ppm.reduce((a, p) => a + p.plantas, 0)
  const mez = await an.mezclaCostos()
  fp.mezcla_total = round(mez.reduce((a, m) => a + m.valor, 0))

  // traceability: order-independent fingerprint (steps + found count).
  const reqs = byId(await repository<Requerimiento>("requerimientos").findAll())
  const steps = await traceabilityService().trazar(reqs[0].id)
  fp.traza_steps = steps.length
  fp.traza_found = steps.filter((s) => s.encontrado).length

  // 6. Presentation queries.
  for (const c of COLLECTIONS) {
    const recs = await loadRecords(c)
    ok(`loadRecords ${c}`, recs.length === EXPECTED[c])
  }
  const mapa = await loadParcelasMapa()
  ok("loadParcelasMapa len", mapa.length === EXPECTED.parcelas)
  ok(
    "loadParcelasMapa shape",
    mapa.every((p) => typeof p.costoTotal === "number" && !!p.ranchoNombre),
  )
  for (const m of MODULES) {
    const labels = await loadLabelMap(m)
    const refs = await loadReferenceOptions(m)
    ok(
      `module ${m.slug}`,
      typeof labels === "object" && typeof refs === "object",
    )
  }
}

async function mutations() {
  console.log("--- mutaciones (lifecycle CRUD) ---")
  // FLAT: ranchos
  const before = await repository("ranchos").count()
  const created = await crudService<Rancho>("ranchos").create({
    nombre: "__TEST__",
    estado: "activo",
  })
  ok("flat create id", !!created.id)
  ok("flat create audit", !!created.createdAt && !!created.updatedAt)
  const got = await crudService<Rancho>("ranchos").get(created.id)
  ok("flat get", got.nombre === "__TEST__")
  const updated = await crudService<Rancho>("ranchos").update(created.id, {
    nombre: "__TEST2__",
  })
  ok("flat update value", updated.nombre === "__TEST2__")
  ok("flat update createdAt stable", updated.createdAt === created.createdAt)
  ok("flat update updatedAt bumped", updated.updatedAt >= created.updatedAt)
  await crudService("ranchos").remove(created.id)
  ok("flat delete", (await repository("ranchos").findById(created.id)) === null)
  ok("flat count restored", (await repository("ranchos").count()) === before)

  // AGGREGATE: requerimientos (+ detalle cascade)
  const productos = byId(await repository<Producto>("productos").findAll())
  const p = productos[0].id
  const reqBefore = await repository("requerimientos").count()
  const req = await crudService<Requerimiento>("requerimientos").create({
    folio: "__T__",
    fecha: new Date().toISOString(),
    solicitante: "tester",
    observaciones: "",
    detalles: [
      { productoId: p, cantidad: 2, unidadMedida: "kg" },
      { productoId: p, cantidad: 3, unidadMedida: "L" },
    ],
  })
  const reqGot = (await repository("requerimientos").findById(req.id)) as {
    detalles: unknown[]
  } | null
  ok("agg create lines", !!reqGot && reqGot.detalles.length === 2)
  const reqUpd = (await crudService<Requerimiento>("requerimientos").update(
    req.id,
    { detalles: [{ productoId: p, cantidad: 9, unidadMedida: "pz" }] },
  )) as { detalles: Array<{ cantidad: number }> }
  ok(
    "agg update replaces lines",
    reqUpd.detalles.length === 1 && reqUpd.detalles[0].cantidad === 9,
  )
  await crudService("requerimientos").remove(req.id)
  ok(
    "agg delete parent",
    (await repository("requerimientos").findById(req.id)) === null,
  )
  ok(
    "agg count restored",
    (await repository("requerimientos").count()) === reqBefore,
  )
  // cascade: child rows gone (SQL only, raw check)
  if (driver === "sql") {
    const sql = postgres(process.env.DATABASE_URL!)
    const rows = await sql.unsafe(
      "select count(*)::int as n from detalle_requerimiento where requerimiento_id = $1",
      [req.id],
    )
    ok("agg cascade children", rows[0].n === 0, `left ${rows[0].n}`)
    await sql.end()
  }
}

async function main() {
  console.log(`=== query battery (driver=${driver}) ===`)
  await reads()
  if (process.env.MUTATE === "1") await mutations()
  console.log(`FINGERPRINT ${JSON.stringify(fp)}`)
  console.log(failures === 0 ? "ALL PASS" : `FAILURES: ${failures}`)
  process.exit(failures === 0 ? 0 : 1)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
