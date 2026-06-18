import "server-only"
import type { BaseEntity } from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import type {
  NewEntity,
  Repository,
  UnitOfWork,
  UpdateEntity,
} from "@/core/domain/repositories"
import { jsonDatastore } from "./json-datastore"

function nowIso(): string {
  return new Date().toISOString()
}

function generateId(collection: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${collection}-${Date.now().toString(36)}-${rand}`
}

/**
 * Generic Repository implementation backed by {@link jsonDatastore}. It honors
 * the {@link Repository} contract exactly, so application services are unaware
 * that the store is a JSON file.
 */
export class JsonRepository<T extends BaseEntity> implements Repository<T> {
  constructor(private readonly collection: string) {}

  async findAll(): Promise<T[]> {
    return jsonDatastore.read<T>(this.collection)
  }

  async findById(id: string): Promise<T | null> {
    const rows = await jsonDatastore.read<T>(this.collection)
    return rows.find((row) => row.id === id) ?? null
  }

  async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    const rows = await jsonDatastore.read<T>(this.collection)
    return rows.filter(predicate)
  }

  async create(data: NewEntity<T>): Promise<T> {
    const timestamp = nowIso()
    const entity = {
      ...(data as object),
      id: generateId(this.collection),
      createdAt: timestamp,
      updatedAt: timestamp,
    } as T

    return jsonDatastore.mutate<T, T>(this.collection, (rows) => ({
      rows: [...rows, entity],
      result: entity,
    }))
  }

  async update(id: string, data: UpdateEntity<T>): Promise<T> {
    return jsonDatastore.mutate<T, T>(this.collection, (rows) => {
      const index = rows.findIndex((row) => row.id === id)
      if (index === -1) throw new NotFoundError(this.collection, id)
      const updated = {
        ...rows[index],
        ...(data as object),
        id: rows[index].id,
        createdAt: rows[index].createdAt,
        updatedAt: nowIso(),
      } as T
      const next = [...rows]
      next[index] = updated
      return { rows: next, result: updated }
    })
  }

  async delete(id: string): Promise<void> {
    return jsonDatastore.mutate<T, void>(this.collection, (rows) => {
      const exists = rows.some((row) => row.id === id)
      if (!exists) throw new NotFoundError(this.collection, id)
      return { rows: rows.filter((row) => row.id !== id), result: undefined }
    })
  }

  async count(): Promise<number> {
    const rows = await jsonDatastore.read<T>(this.collection)
    return rows.length
  }
}

/** Unit-of-work that lazily caches one repository per collection. */
export class JsonUnitOfWork implements UnitOfWork {
  private readonly repos = new Map<string, JsonRepository<BaseEntity>>()

  repository<T extends BaseEntity>(collection: string): Repository<T> {
    let repo = this.repos.get(collection)
    if (!repo) {
      repo = new JsonRepository<BaseEntity>(collection)
      this.repos.set(collection, repo)
    }
    return repo as unknown as Repository<T>
  }
}
