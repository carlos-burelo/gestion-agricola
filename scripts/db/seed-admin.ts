import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@/infrastructure/persistence/sql/schema"
import { hashPassword } from "@/infrastructure/auth/password"
import { generateId, nowDate } from "@/infrastructure/persistence/sql/util"

const EMAIL = process.env.ADMIN_EMAIL ?? "admin@tesoreria.local"
const PASSWORD = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave-123"
const NOMBRE = process.env.ADMIN_NOMBRE ?? "Administrador"

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  const usuarios = await db.select().from(schema.usuarios)
  if (usuarios.some((u) => u.rol === "admin")) {
    console.log("Ya existe al menos un usuario admin — no se crea otro.")
    await sql.end()
    return
  }
  if (usuarios.some((u) => u.email === EMAIL)) {
    console.log(`Ya existe un usuario con el correo ${EMAIL} (rol no-admin) — no se crea otro.`)
    await sql.end()
    return
  }

  const now = nowDate()
  await db.insert(schema.usuarios).values({
    id: generateId("usuarios"),
    nombre: NOMBRE,
    email: EMAIL,
    passwordHash: hashPassword(PASSWORD),
    rol: "admin",
    estado: "activo",
    createdAt: now,
    updatedAt: now,
  })

  console.log(`Usuario admin creado: ${EMAIL}`)
  console.log(
    "Contraseña: la definida en ADMIN_PASSWORD, o la default de este script si no se pasó — cámbiala después de tu primer login.",
  )
  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
