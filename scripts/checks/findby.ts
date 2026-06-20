import assert from "node:assert/strict"
import { JsonRepository } from "@/infrastructure/persistence/json/repository"
import type { MovimientoInventario } from "@/core/domain/entities"

async function main() {
  const repo = new JsonRepository<MovimientoInventario>("movimientosInventario")
  const all = await repo.findAll()
  const target = all[0]
  const byProducto = await repo.findBy({ productoId: target.productoId })
  assert.ok(byProducto.length > 0, "findBy debe devolver coincidencias")
  assert.ok(
    byProducto.every((m) => m.productoId === target.productoId),
    "todas las filas coinciden con el criterio",
  )
  const byTwo = await repo.findBy({
    productoId: target.productoId,
    tipo: target.tipo,
  })
  assert.ok(
    byTwo.every((m) => m.productoId === target.productoId && m.tipo === target.tipo),
  )
  console.log("OK findBy:", byProducto.length, "filas")
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
