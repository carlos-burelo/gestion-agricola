import "server-only"
import { and, asc, eq, getTableColumns, inArray } from "drizzle-orm"
import type { BaseEntity } from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import type {
  NewEntity,
  Repository,
  UpdateEntity,
} from "@/core/domain/repositories"
import { db } from "./client"
import { aggConfigs, toEntity, toRow } from "./table-config"
import { generateId, nowDate } from "./util"

type WithDetalles = BaseEntity & { detalles: Record<string, unknown>[] }

export class AggregateRepository<T extends BaseEntity>
  implements Repository<T>
{
  private readonly cfg = aggConfigs[this.collection]
  constructor(private readonly collection: string) {
    if (!this.cfg) throw new Error(`Sin config de agregado para ${collection}`)
  }

  private parentCols() {
    return getTableColumns(this.cfg.table) as Record<string, unknown>
  }
  private childCols() {
    return getTableColumns(this.cfg.child) as Record<string, unknown>
  }

  /** Stable deterministic order for parents (matches JSON insertion). */
  private order() {
    const c = this.parentCols()
    return [asc(c.createdAt as never), asc(c.id as never)]
  }

  /** Quita id/fk de la fila hija para exponer sólo los campos de la línea. */
  private stripLine(
    childRow: Record<string, unknown>,
  ): Record<string, unknown> {
    const { id: _id, [this.cfg.parentFk]: _fk, ...line } = childRow
    void _id
    void _fk
    return line
  }

  private async hydrate(
    parentRows: Record<string, unknown>[],
  ): Promise<T[]> {
    if (parentRows.length === 0) return []
    const ids = parentRows.map((r) => r.id as string)
    const fkCol = this.childCols()[this.cfg.parentFk] as never
    const childRows = await db
      .select()
      .from(this.cfg.child)
      .where(inArray(fkCol, ids))
      .orderBy(asc(this.childCols().id as never))
    const byParent = new Map<string, Record<string, unknown>[]>()
    for (const c of childRows) {
      const key = (c as Record<string, unknown>)[this.cfg.parentFk] as string
      const list = byParent.get(key) ?? []
      list.push(this.stripLine(c as Record<string, unknown>))
      byParent.set(key, list)
    }
    return parentRows.map((p) => {
      const entity = toEntity<WithDetalles>(p, this.cfg.dateFields)
      entity.detalles = byParent.get(p.id as string) ?? []
      return entity as unknown as T
    })
  }

  async findAll(): Promise<T[]> {
    const rows = await db
      .select()
      .from(this.cfg.table)
      .orderBy(...this.order())
    return this.hydrate(rows)
  }

  async findById(id: string): Promise<T | null> {
    const idCol = this.parentCols().id as never
    const rows = await db.select().from(this.cfg.table).where(eq(idCol, id))
    const [hydrated] = await this.hydrate(rows)
    return hydrated ?? null
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    const cols = this.parentCols()
    // Sólo se filtra por columnas del padre (las líneas no son criterio).
    const conv = toRow(criteria as Record<string, unknown>, this.cfg.dateFields)
    const conds = Object.entries(conv)
      .filter(([k]) => k in cols)
      .map(([k, v]) => eq(cols[k] as never, v as never))
    const rows = conds.length
      ? await db
          .select()
          .from(this.cfg.table)
          .where(and(...conds))
          .orderBy(...this.order())
      : await db.select().from(this.cfg.table).orderBy(...this.order())
    return this.hydrate(rows)
  }

  async create(data: NewEntity<T>): Promise<T> {
    const now = nowDate()
    const id = generateId(this.collection)
    const { detalles = [], ...parent } = data as unknown as WithDetalles
    const parentValues = {
      ...toRow(parent as Record<string, unknown>, this.cfg.dateFields),
      id,
      createdAt: now,
      updatedAt: now,
    }
    await db.transaction(async (tx) => {
      await tx.insert(this.cfg.table).values(parentValues as never)
      if (detalles.length > 0) {
        const childValues = detalles.map((d) => ({
          ...d,
          [this.cfg.parentFk]: id,
        }))
        await tx.insert(this.cfg.child).values(childValues as never)
      }
    })
    const created = await this.findById(id)
    if (!created) throw new NotFoundError(this.collection, id)
    return created
  }

  async update(id: string, data: UpdateEntity<T>): Promise<T> {
    const idCol = this.parentCols().id as never
    const fkCol = this.childCols()[this.cfg.parentFk] as never
    const { detalles, ...parent } = data as Partial<WithDetalles>
    const parentValues = {
      ...toRow(parent as Record<string, unknown>, this.cfg.dateFields),
      updatedAt: nowDate(),
    }
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(this.cfg.table)
        .set(parentValues as never)
        .where(eq(idCol, id))
        .returning()
      if (updated.length === 0) throw new NotFoundError(this.collection, id)
      // Reemplazo total de las líneas si se proporcionan.
      if (detalles !== undefined) {
        await tx.delete(this.cfg.child).where(eq(fkCol, id))
        if (detalles.length > 0) {
          const childValues = detalles.map((d) => ({
            ...d,
            [this.cfg.parentFk]: id,
          }))
          await tx.insert(this.cfg.child).values(childValues as never)
        }
      }
    })
    const result = await this.findById(id)
    if (!result) throw new NotFoundError(this.collection, id)
    return result
  }

  async delete(id: string): Promise<void> {
    const idCol = this.parentCols().id as never
    // FK ON DELETE CASCADE elimina las líneas hijas.
    const rows = await db
      .delete(this.cfg.table)
      .where(eq(idCol, id))
      .returning()
    if (rows.length === 0) throw new NotFoundError(this.collection, id)
  }

  async count(): Promise<number> {
    const rows = await db.select().from(this.cfg.table)
    return rows.length
  }
}
