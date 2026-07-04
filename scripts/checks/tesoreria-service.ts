import "dotenv/config"
import assert from "node:assert/strict"
import { repository, tesoreriaService } from "@/infrastructure/container"

async function main() {
  const cuentaRepo = repository("cuentas")
  const cuenta = await cuentaRepo.create({
    nombre: "Check TesoreriaService",
    tipo: "efectivo",
    moneda: "MXN",
    saldoInicial: 1000,
    estado: "activo",
  })

  const movRepo = repository("movimientos")
  await movRepo.create({
    cuentaId: cuenta.id,
    fecha: "2025-03-05T00:00:00.000Z",
    direccion: "entrada",
    categoriaId: "",
    monto: 500,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "check",
    traspasoId: "",
    creadoPor: "",
  })
  await movRepo.create({
    cuentaId: cuenta.id,
    fecha: "2025-03-06T00:00:00.000Z",
    direccion: "salida",
    categoriaId: "",
    monto: 200,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "check",
    traspasoId: "",
    creadoPor: "",
  })

  const service = tesoreriaService()
  const saldo = await service.saldoDeCuenta(cuenta.id)
  assert.equal(saldo, 1300, "1000 + 500 - 200 = 1300")

  const saldos = await service.saldosDeTodasLasCuentas()
  assert.equal(saldos[cuenta.id], 1300)

  console.log("OK tesoreria-service:", { saldo })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
