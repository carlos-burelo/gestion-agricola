import "dotenv/config"
import assert from "node:assert/strict"
import { crearTraspaso, repository, tesoreriaService } from "@/infrastructure/container"

async function main() {
  const cuentaRepo = repository("cuentas")
  const origen = await cuentaRepo.create({
    nombre: "Check Origen",
    tipo: "efectivo",
    moneda: "MXN",
    saldoInicial: 1000,
    estado: "activo",
  })
  const destino = await cuentaRepo.create({
    nombre: "Check Destino",
    tipo: "efectivo",
    moneda: "MXN",
    saldoInicial: 0,
    estado: "activo",
  })

  const resultado = await crearTraspaso({
    fecha: "2025-04-01T00:00:00.000Z",
    cuentaOrigenId: origen.id,
    cuentaDestinoId: destino.id,
    monto: 300,
  })

  assert.equal(resultado.movimientoOrigen.direccion, "salida")
  assert.equal(resultado.movimientoOrigen.cuentaId, origen.id)
  assert.equal(resultado.movimientoDestino.direccion, "entrada")
  assert.equal(resultado.movimientoDestino.cuentaId, destino.id)
  assert.equal(resultado.movimientoOrigen.traspasoId, resultado.traspaso.id)
  assert.equal(resultado.movimientoDestino.traspasoId, resultado.traspaso.id)

  const service = tesoreriaService()
  assert.equal(await service.saldoDeCuenta(origen.id), 700, "1000 - 300")
  assert.equal(await service.saldoDeCuenta(destino.id), 300, "0 + 300")

  // Regla de negocio: misma cuenta origen/destino debe rechazarse.
  await assert.rejects(
    () =>
      crearTraspaso({
        fecha: "2025-04-01T00:00:00.000Z",
        cuentaOrigenId: origen.id,
        cuentaDestinoId: origen.id,
        monto: 100,
      }),
    /misma/i,
  )

  console.log("OK tesoreria-traspaso")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
