import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@/infrastructure/persistence/sql/schema"
import { hashPassword } from "@/infrastructure/auth/password"
import { generateId, nowDate } from "@/infrastructure/persistence/sql/util"

/**
 * Fixtures propias para los tests E2E de mutación (traspasos, captura de
 * movimientos, control de acceso por persona). Nunca tocan las 22 cuentas
 * reales importadas del Excel — todo lo que crea esta clase se prefija
 * "E2E " y se borra en `teardown()`, incluso si un test falla a medio camino.
 */
export class TesoreriaFixtures {
  private sql = postgres(process.env.DATABASE_URL!)
  private db = drizzle(this.sql, { schema })
  private cuentaIds: string[] = []
  private usuarioIds: string[] = []

  async crearCuenta(nombre: string, saldoInicial = 0) {
    const id = generateId("cuentas")
    const now = nowDate()
    await this.db.insert(schema.cuentas).values({
      id,
      nombre: `E2E ${nombre}`,
      tipo: "efectivo",
      moneda: "MXN",
      saldoInicial,
      estado: "activo",
      createdAt: now,
      updatedAt: now,
    })
    this.cuentaIds.push(id)
    return id
  }

  async crearUsuarioPersona(email: string, password: string, cuentaIds: string[]) {
    const id = generateId("usuarios")
    const now = nowDate()
    await this.db.insert(schema.usuarios).values({
      id,
      nombre: "E2E Persona",
      email,
      passwordHash: hashPassword(password),
      rol: "persona",
      estado: "activo",
      createdAt: now,
      updatedAt: now,
    })
    this.usuarioIds.push(id)
    for (const cuentaId of cuentaIds) {
      await this.db.insert(schema.usuarioCuentas).values({
        id: generateId("usuarioCuentas"),
        usuarioId: id,
        cuentaId,
        createdAt: now,
        updatedAt: now,
      })
    }
    return id
  }

  /** Categoría hoja real ya existente en el catálogo, útil para captura de movimientos. */
  async categoriaHoja(nombre: string, tipo: "ingreso" | "egreso") {
    const todas = await this.db.select().from(schema.categorias)
    const match = todas.find((c) => c.nombre === nombre && c.tipo === tipo)
    if (!match) throw new Error(`Categoría no encontrada: ${nombre} (${tipo})`)
    return match.id
  }

  async idDeCuenta(nombre: string): Promise<string> {
    const rows = await this.sql<{ id: string }[]>`
      select id from cuentas where nombre = ${nombre} limit 1
    `
    if (!rows[0]) throw new Error(`Cuenta no encontrada: ${nombre}`)
    return rows[0].id
  }

  /**
   * Para las 22 cuentas REALES importadas (nombres únicos garantizados).
   * No usar para cuentas de fixture: si un test previo dejó un duplicado a
   * medio limpiar, el match por nombre puede resolver al registro
   * equivocado. Las cuentas de fixture siempre se consultan por id
   * (`saldoDeCuentaId`), devuelto por `crearCuenta`.
   */
  async saldoRealDeCuenta(nombre: string): Promise<number> {
    const rows = await this.sql<{ saldo: string }[]>`
      select
        (c.saldo_inicial + coalesce(sum(
          case when m.direccion = 'entrada' then m.monto
               when m.direccion = 'salida' then -m.monto
               else 0 end
        ), 0))::numeric as saldo
      from cuentas c
      left join movimientos m on m.cuenta_id = c.id
      where c.nombre = ${nombre}
      group by c.id, c.saldo_inicial
    `
    return Number(rows[0]?.saldo ?? 0)
  }

  async saldoDeCuentaId(cuentaId: string): Promise<number> {
    const rows = await this.sql<{ saldo: string }[]>`
      select
        (c.saldo_inicial + coalesce(sum(
          case when m.direccion = 'entrada' then m.monto
               when m.direccion = 'salida' then -m.monto
               else 0 end
        ), 0))::numeric as saldo
      from cuentas c
      left join movimientos m on m.cuenta_id = c.id
      where c.id = ${cuentaId}
      group by c.id, c.saldo_inicial
    `
    return Number(rows[0]?.saldo ?? 0)
  }

  async teardown() {
    if (this.cuentaIds.length > 0) {
      await this.sql`delete from movimientos where cuenta_id = any(${this.cuentaIds})`
      await this.sql`delete from traspasos where cuenta_origen_id = any(${this.cuentaIds}) or cuenta_destino_id = any(${this.cuentaIds})`
    }
    if (this.usuarioIds.length > 0) {
      await this.sql`delete from usuario_cuentas where usuario_id = any(${this.usuarioIds})`
      await this.sql`delete from usuarios where id = any(${this.usuarioIds})`
    }
    if (this.cuentaIds.length > 0) {
      await this.sql`delete from cuentas where id = any(${this.cuentaIds})`
    }
    await this.sql.end()
  }
}
