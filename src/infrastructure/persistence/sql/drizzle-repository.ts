import "server-only"
import { and, eq, getTableColumns } from "drizzle-orm"
import type { BaseEntity } from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import type {
  NewEntity,
  Repository,
  UpdateEntity,
} from "@/core/domain/repositories"
import { db } from "./client"
import { flatConfigs, toEntity, toRow } from "./table-config"
import { generateId, nowDate } from "./util"

export class DrizzleRepository<T extends BaseEntity> implements Repository<T> {
  private readonly cfg = flatConfigs[this.collection]
  constructor(private readonly collection: string) {
    if (!this.cfg) throw new Error(`Sin config plana para ${collection}`)
  }

  private cols() {
    return getTableColumns(this.cfg.table) as Record<string, unknown>
  }

  async findAll(): Promise<T[]> {
    const rows = await db.select().from(this.cfg.table)
    return rows.map((r) => toEntity<T>(r, this.cfg.dateFields))
  }

  async findById(id: string): Promise<T | null> {
    const idCol = this.cols().id as never
    const rows = await db.select().from(this.cfg.table).where(eq(idCol, id))
    const row = rows[0]
    return row ? toEntity<T>(row, this.cfg.dateFields) : null
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    const cols = this.cols()
    const conv = toRow(criteria as Record<string, unknown>, this.cfg.dateFields)
    const conds = Object.entries(conv).map(([k, v]) =>
      eq(cols[k] as never, v as never),
    )
    const rows = await db
      .select()
      .from(this.cfg.table)
      .where(and(...conds))
    return rows.map((r) => toEntity<T>(r, this.cfg.dateFields))
  }

  async create(data: NewEntity<T>): Promise<T> {
    const now = nowDate()
    const values = {
      ...toRow(data as Record<string, unknown>, this.cfg.dateFields),
      id: generateId(this.collection),
      createdAt: now,
      updatedAt: now,
    }
    const [row] = await db
      .insert(this.cfg.table)
      .values(values as never)
      .returning()
    return toEntity<T>(row, this.cfg.dateFields)
  }

  async update(id: string, data: UpdateEntity<T>): Promise<T> {
    const idCol = this.cols().id as never
    const values = {
      ...toRow(data as Record<string, unknown>, this.cfg.dateFields),
      updatedAt: nowDate(),
    }
    const [row] = await db
      .update(this.cfg.table)
      .set(values as never)
      .where(eq(idCol, id))
      .returning()
    if (!row) throw new NotFoundError(this.collection, id)
    return toEntity<T>(row, this.cfg.dateFields)
  }

  async delete(id: string): Promise<void> {
    const idCol = this.cols().id as never
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
