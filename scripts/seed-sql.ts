import "dotenv/config"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@/infrastructure/persistence/sql/schema"
import {
  aggConfigs,
  flatConfigs,
  toRow,
} from "@/infrastructure/persistence/sql/table-config"

// Orden de inserción respetando FKs (padres antes que hijos).
const ORDER = [
  "ranchos",
  "parcelas",
  "plantillas",
  "ciclos",
  "siembras",
  "semilleros",
  "actividades",
  "registrosActividad",
  "productos",
  "proveedores",
  "movimientosInventario",
  "requerimientos",
  "cotizaciones",
  "ordenesCompra",
  "recepciones",
  "cuentasPorPagar",
  "valesSalida",
] as const

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  const file = path.join(process.cwd(), ".data", "database.json")
  const data = JSON.parse(await readFile(file, "utf-8")) as Record<
    string,
    Record<string, unknown>[]
  >

  // Vaciar todo (hijas por CASCADE).
  await sql`
    TRUNCATE TABLE
      ranchos, parcelas, plantillas, ciclos, siembras, semilleros,
      actividades, registros_actividad, productos, proveedores,
      movimientos_inventario, requerimientos, detalle_requerimiento,
      cotizaciones, detalle_cotizacion, ordenes_compra, detalle_orden_compra,
      recepciones, detalle_recepcion, cuentas_por_pagar, vales_salida, detalle_vale
    RESTART IDENTITY CASCADE
  `

  let totalLines = 0
  for (const name of ORDER) {
    const rows = data[name] ?? []
    if (rows.length === 0) continue
    const agg = aggConfigs[name]
    if (agg) {
      const parents = rows.map((r) => {
        const { detalles, ...rest } = r as { detalles?: unknown[] }
        void detalles
        return toRow(rest, agg.dateFields)
      })
      await db.insert(agg.table).values(parents as never)
      const children = rows.flatMap((r) =>
        ((r.detalles as Record<string, unknown>[] | undefined) ?? []).map(
          (d) => ({ ...d, [agg.parentFk]: r.id as string }),
        ),
      )
      if (children.length > 0) {
        await db.insert(agg.child).values(children as never)
        totalLines += children.length
      }
    } else {
      const cfg = flatConfigs[name]
      const values = rows.map((r) =>
        toRow(r, cfg.dateFields, cfg.nullableFields),
      )
      await db.insert(cfg.table).values(values as never)
    }
    console.log(`  ${name}: ${rows.length}`)
  }
  console.log(`  (líneas hijas: ${totalLines})`)
  console.log("OK seed")
  await sql.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
