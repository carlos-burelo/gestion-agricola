/**
 * Repository ports (interfaces) — the boundary that enables a transparent
 * migration to a real database.
 *
 * Application services depend ONLY on these interfaces (Dependency Inversion
 * Principle). Today they are implemented by a JSON-file adapter; tomorrow a
 * Postgres/Neon adapter can implement the exact same contract and nothing in
 * the domain or application layers changes.
 */

import type { BaseEntity } from "./entities"

/** Fields that the repository assigns automatically on create. */
export type NewEntity<T extends BaseEntity> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>

/** Fields a caller may update (everything except identity/audit columns). */
export type UpdateEntity<T extends BaseEntity> = Partial<NewEntity<T>>

/**
 * Generic CRUD contract for a single collection/table. A real ORM repository
 * would implement the same async surface, so callers never change.
 */
export interface Repository<T extends BaseEntity> {
  findAll(): Promise<T[]>
  findById(id: string): Promise<T | null>
  findWhere(predicate: (entity: T) => boolean): Promise<T[]>
  create(data: NewEntity<T>): Promise<T>
  update(id: string, data: UpdateEntity<T>): Promise<T>
  delete(id: string): Promise<void>
  count(): Promise<number>
}

/**
 * Unit-of-work style provider that hands out a repository per collection. The
 * concrete implementation decides the backing store (JSON file, SQL, etc.).
 */
export interface UnitOfWork {
  repository<T extends BaseEntity>(collection: string): Repository<T>
}
