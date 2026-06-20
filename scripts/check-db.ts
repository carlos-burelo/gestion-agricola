import "dotenv/config"
import postgres from "postgres"

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const [row] = await sql`select version()`
  console.log("OK conexión:", row.version)
  await sql.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
