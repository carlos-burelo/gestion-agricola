import "dotenv/config"
import { inventoryService, repository } from "@/infrastructure/container"

async function main() {
  const driver = process.env.DB_DRIVER ?? "sql"
  const productos = await repository("productos").findAll()
  const existencias = await inventoryService().existencias()
  // Resumen determinista: total de existencia y valor de inventario.
  const totalExistencia = existencias.reduce((a, e) => a + e.existencia, 0)
  const totalValor = existencias.reduce((a, e) => a + e.valorInventario, 0)
  console.log(
    JSON.stringify({
      driver,
      productos: productos.length,
      totalExistencia: Number(totalExistencia.toFixed(4)),
      totalValor: Number(totalValor.toFixed(2)),
    }),
  )
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
