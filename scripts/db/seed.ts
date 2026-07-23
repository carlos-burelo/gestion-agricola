import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@/infrastructure/persistence/sql/schema"
import {
  aggConfigs,
  flatConfigs,
  toRow,
} from "@/infrastructure/persistence/sql/table-config"
import { generateSeedData } from "./seed-data"

const ORDER = [
  "ranchos",
  "parcelas",
  "plantillas",
  "ciclos",
  "siembras",
  "semilleros",
  "actividades",
  "trabajadores",
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
  "clientes",
  "catGastosOperativos",
  "catGastosFinancieros",
  "catGastosAdministrativos",
  "catGastosFamilia",
  "familiares",
  "cuentas",
  "ventasPina",
  "ventasGanado",
  "anticiposClientes",
  "abonosClientes",
  "prestamosBancarios",
  "prestamosExternos",
  "abonosPrestamos",
  "transferenciasHijuelos",
  "cargosComisiones",
  "gastosExternos",
  "usuarios",
  "usuarioCuentas",
] as const

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  await sql`ALTER TABLE usuarios ALTER COLUMN rol TYPE text;`
  await sql`ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS familiar_id text;`

  const data = generateSeedData() as Record<string, Record<string, unknown>[]>

  await sql`
    TRUNCATE TABLE
      ranchos, parcelas, plantillas, ciclos, siembras, semilleros,
      actividades, trabajadores, registros_actividad, productos, proveedores,
      movimientos_inventario, requerimientos, detalle_requerimiento,
      cotizaciones, detalle_cotizacion, ordenes_compra, detalle_orden_compra,
      recepciones, detalle_recepcion, cuentas_por_pagar, vales_salida, detalle_vale,
      clientes, cat_gastos_operativos, cat_gastos_financieros, cat_gastos_administrativos,
      cat_gastos_familia, familiares, cuentas, ventas_pina, ventas_ganado,
      anticipos_clientes, abonos_clientes, prestamos_bancarios, prestamos_externos,
      abonos_prestamos, transferencias_hijuelos, cargos_comisiones, gastos_externos,
      usuarios, usuario_cuentas
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
      if (!cfg) {
        console.warn(`No config found for ${name}`)
        continue
      }
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
