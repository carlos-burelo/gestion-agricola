/** Domain-level errors. Pure: no framework or transport concerns. */

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DomainError"
  }
}

/** Thrown when an entity referenced by id does not exist. */
export class NotFoundError extends DomainError {
  constructor(collection: string, id: string) {
    super(`No se encontró el registro "${id}" en "${collection}".`)
    this.name = "NotFoundError"
  }
}

/** Thrown when a business invariant is violated. */
export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = "BusinessRuleError"
  }
}

/** Thrown when there is not enough stock to satisfy a PEPS withdrawal. */
export class InsufficientStockError extends BusinessRuleError {
  constructor(productoId: string, requested: number, available: number) {
    super(
      `Existencia insuficiente para el producto "${productoId}": ` +
        `solicitado ${requested}, disponible ${available}.`,
    )
    this.name = "InsufficientStockError"
  }
}
