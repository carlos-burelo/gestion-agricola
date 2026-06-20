import type {
  MovimientoInventario,
  Producto,
} from "@/core/domain/entities"
import { InsufficientStockError } from "@/core/domain/errors"
import type { Repository } from "@/core/domain/repositories"

export interface KardexRow {
  movimientoId: string
  fecha: string
  tipo: "entrada" | "salida"
  cantidad: number
  costoUnitario: number
  importe: number
  saldoCantidad: number
  saldoImporte: number
  referencia: string
}

export interface ExistenciaProducto {
  producto: Producto
  existencia: number
  valorInventario: number
  costoPromedio: number
}

/**
 * Inventory use-cases implementing the PEPS (FIFO) valuation method. All
 * business rules live here, independent of how movements are stored.
 */
export class InventoryService {
  constructor(
    private readonly movimientos: Repository<MovimientoInventario>,
    private readonly productos: Repository<Producto>,
  ) {}

  private sortByDate(rows: MovimientoInventario[]): MovimientoInventario[] {
    return [...rows].sort((a, b) => {
      const diff = a.fecha.localeCompare(b.fecha)
      return diff !== 0 ? diff : a.createdAt.localeCompare(b.createdAt)
    })
  }

  /** Builds the PEPS kardex for a product, computing running balances. */
  async kardex(productoId: string): Promise<KardexRow[]> {
    const movs = this.sortByDate(
      await this.movimientos.findBy({ productoId }),
    )

    // FIFO layers: each entrada adds a layer; each salida consumes oldest first.
    const layers: { cantidad: number; costoUnitario: number }[] = []
    let saldoCantidad = 0
    let saldoImporte = 0
    const rows: KardexRow[] = []

    for (const mov of movs) {
      if (mov.tipo === "entrada") {
        layers.push({ cantidad: mov.cantidad, costoUnitario: mov.costoUnitario })
        saldoCantidad += mov.cantidad
        saldoImporte += mov.cantidad * mov.costoUnitario
        rows.push({
          movimientoId: mov.id,
          fecha: mov.fecha,
          tipo: "entrada",
          cantidad: mov.cantidad,
          costoUnitario: mov.costoUnitario,
          importe: mov.cantidad * mov.costoUnitario,
          saldoCantidad,
          saldoImporte,
          referencia: mov.factura || mov.proveedorId || "",
        })
      } else {
        let pending = mov.cantidad
        let costOut = 0
        while (pending > 0 && layers.length > 0) {
          const layer = layers[0]
          const take = Math.min(layer.cantidad, pending)
          costOut += take * layer.costoUnitario
          layer.cantidad -= take
          pending -= take
          if (layer.cantidad === 0) layers.shift()
        }
        saldoCantidad -= mov.cantidad - pending
        saldoImporte -= costOut
        rows.push({
          movimientoId: mov.id,
          fecha: mov.fecha,
          tipo: "salida",
          cantidad: mov.cantidad,
          costoUnitario: mov.cantidad ? costOut / mov.cantidad : 0,
          importe: costOut,
          saldoCantidad,
          saldoImporte,
          referencia: mov.destino || "",
        })
      }
    }
    return rows
  }

  /** Current quantity on hand for a product (entradas - salidas). */
  async existencia(productoId: string): Promise<number> {
    const movs = await this.movimientos.findBy({ productoId })
    return movs.reduce(
      (acc, m) => acc + (m.tipo === "entrada" ? m.cantidad : -m.cantidad),
      0,
    )
  }

  /** Existence + PEPS valuation for every product. */
  async existencias(): Promise<ExistenciaProducto[]> {
    const productos = await this.productos.findAll()
    const result: ExistenciaProducto[] = []
    for (const producto of productos) {
      const kardex = await this.kardex(producto.id)
      const last = kardex[kardex.length - 1]
      const existencia = last ? last.saldoCantidad : 0
      const valor = last ? last.saldoImporte : 0
      result.push({
        producto,
        existencia,
        valorInventario: valor,
        costoPromedio: existencia ? valor / existencia : 0,
      })
    }
    return result
  }

  /**
   * Registers a withdrawal, enforcing that stock is sufficient before writing.
   * The cost is resolved by the PEPS kardex, not supplied by the caller.
   */
  async registrarSalida(input: {
    productoId: string
    cantidad: number
    fecha: string
    destino: string
  }): Promise<MovimientoInventario> {
    const disponible = await this.existencia(input.productoId)
    if (input.cantidad > disponible) {
      throw new InsufficientStockError(
        input.productoId,
        input.cantidad,
        disponible,
      )
    }
    return this.movimientos.create({
      productoId: input.productoId,
      tipo: "salida",
      fecha: input.fecha,
      cantidad: input.cantidad,
      costoUnitario: 0,
      proveedorId: "",
      factura: "",
      destino: input.destino,
    })
  }
}
