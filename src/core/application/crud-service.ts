import type { BaseEntity } from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import type {
  NewEntity,
  Repository,
  UpdateEntity,
} from "@/core/domain/repositories"

/**
 * Reusable application service exposing generic CRUD use-cases on top of any
 * {@link Repository}. Specialized services (inventory, costing) compose or
 * extend this rather than re-implementing persistence orchestration.
 *
 * Depends on the Repository abstraction only — Dependency Inversion in action.
 */
export class CrudService<T extends BaseEntity> {
  constructor(protected readonly repo: Repository<T>) {}

  list(): Promise<T[]> {
    return this.repo.findAll()
  }

  async get(id: string): Promise<T> {
    const entity = await this.repo.findById(id)
    if (!entity) throw new NotFoundError("registro", id)
    return entity
  }

  create(data: NewEntity<T>): Promise<T> {
    return this.repo.create(data)
  }

  update(id: string, data: UpdateEntity<T>): Promise<T> {
    return this.repo.update(id, data)
  }

  remove(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}
