import "dotenv/config"
import postgres from "postgres"

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)

  try {
    await sql`DO $$ BEGIN
      CREATE TYPE titular_tipo AS ENUM('cliente', 'proveedor', 'trabajador', 'familiar', 'negocio');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`
    console.log("Enum titular_tipo created or exists")
  } catch (err: unknown) {
    console.warn("Enum warning:", (err as Error).message)
  }

  try {
    await sql`ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS titular_tipo titular_tipo`
    await sql`ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS titular_nombre text`
    await sql`ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS banco_nombre text`
    await sql`ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS numero_cuenta text`
    console.log("Cuentas owner columns added successfully")
  } catch (err: unknown) {
    console.warn("Cuentas columns warning:", (err as Error).message)
  }

  console.log("Database schema migration applied successfully")
  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
