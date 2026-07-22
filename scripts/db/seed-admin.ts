import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import { eq } from "drizzle-orm"
import postgres from "postgres"
import * as schema from "@/infrastructure/persistence/sql/schema"
import { hashPassword } from "@/infrastructure/auth/password"
import { generateId, nowDate } from "@/infrastructure/persistence/sql/util"

const EMAIL = process.env.ADMIN_EMAIL ?? "admin@mgz.mx"
const PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123"
const NOMBRE = process.env.ADMIN_NOMBRE ?? "Administrador General"

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  const usuarios = await db.select().from(schema.usuarios)
  const existingAdmin = usuarios.find((u) => u.email === EMAIL || u.rol === "admin")

  const now = nowDate()
  const hashed = hashPassword(PASSWORD)

  if (existingAdmin) {
    await db
      .update(schema.usuarios)
      .set({
        email: EMAIL,
        passwordHash: hashed,
        updatedAt: now,
      })
      .where(eq(schema.usuarios.id, existingAdmin.id))
    console.log(`✓ Usuario admin actualizado: ${EMAIL}`)
    console.log(`✓ Contraseña lista para iniciar sesión: ${PASSWORD}`)
  } else {
    await db.insert(schema.usuarios).values({
      id: generateId("usuarios"),
      nombre: NOMBRE,
      email: EMAIL,
      passwordHash: hashed,
      rol: "admin",
      estado: "activo",
      createdAt: now,
      updatedAt: now,
    })
    console.log(`✓ Usuario admin creado: ${EMAIL}`)
    console.log(`✓ Contraseña lista para iniciar sesión: ${PASSWORD}`)
  }

  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
