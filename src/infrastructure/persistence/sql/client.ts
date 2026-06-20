import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL no definida")

// Reusar la conexión entre hot-reloads de Next en dev.
const globalForDb = globalThis as unknown as {
  _sql?: ReturnType<typeof postgres>
}
export const sql = globalForDb._sql ?? postgres(connectionString, { max: 10 })
if (process.env.NODE_ENV !== "production") globalForDb._sql = sql

export const db = drizzle(sql, { schema })
