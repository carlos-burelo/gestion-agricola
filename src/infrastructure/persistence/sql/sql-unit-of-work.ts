import "server-only"
import type { BaseEntity } from "@/core/domain/entities"
import type { Repository, UnitOfWork } from "@/core/domain/repositories"
import { AggregateRepository } from "./aggregate-repository"
import { DrizzleRepository } from "./drizzle-repository"
import { aggConfigs } from "./table-config"

export class SqlUnitOfWork implements UnitOfWork {
  private readonly repos = new Map<string, Repository<BaseEntity>>()

  repository<T extends BaseEntity>(collection: string): Repository<T> {
    let repo = this.repos.get(collection)
    if (!repo) {
      repo =
        collection in aggConfigs
          ? new AggregateRepository<BaseEntity>(collection)
          : new DrizzleRepository<BaseEntity>(collection)
      this.repos.set(collection, repo)
    }
    return repo as unknown as Repository<T>
  }
}
