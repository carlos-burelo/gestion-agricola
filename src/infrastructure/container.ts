import "server-only"
import { AnalyticsService } from "@/core/application/analytics-service"
import { CostingService } from "@/core/application/costing-service"
import { CrudService } from "@/core/application/crud-service"
import { InventoryService } from "@/core/application/inventory-service"
import { TesoreriaService } from "@/core/application/tesoreria-service"
import { TraceabilityService } from "@/core/application/traceability-service"
import type { BaseEntity, CollectionName } from "@/core/domain/entities"
import type { Repository, UnitOfWork } from "@/core/domain/repositories"
import { SqlUnitOfWork } from "./persistence/sql/unit-of-work"

/**
 * Composition root. This is the ONLY module that decides which concrete
 * implementation satisfies the domain ports. Every consumer imports the same
 * factory functions below and never touches `SqlUnitOfWork` directly.
 */
const uow: UnitOfWork = new SqlUnitOfWork()

export function repository<T extends BaseEntity>(
  collection: CollectionName,
): Repository<T> {
  return uow.repository<T>(collection)
}

/** Generic CRUD service for a given collection. */
export function crudService<T extends BaseEntity>(
  collection: CollectionName,
): CrudService<T> {
  return new CrudService<T>(repository<T>(collection))
}

export function inventoryService(): InventoryService {
  return new InventoryService(
    repository("movimientosInventario"),
    repository("productos"),
  )
}

export function costingService(): CostingService {
  return new CostingService(
    repository("registrosActividad"),
    repository("valesSalida"),
    repository("semilleros"),
  )
}

export function analyticsService(): AnalyticsService {
  return new AnalyticsService(
    repository("registrosActividad"),
    repository("valesSalida"),
    repository("siembras"),
    repository("semilleros"),
  )
}

export function traceabilityService(): TraceabilityService {
  return new TraceabilityService(
    repository("requerimientos"),
    repository("cotizaciones"),
    repository("ordenesCompra"),
    repository("recepciones"),
    repository("cuentasPorPagar"),
    repository("valesSalida"),
  )
}

export function tesoreriaService(): TesoreriaService {
  return new TesoreriaService(
    repository("cuentas"),
    repository("categorias"),
    repository("movimientos"),
  )
}

export { crearTraspaso } from "./persistence/sql/tesoreria"
