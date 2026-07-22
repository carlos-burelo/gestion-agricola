import { redirect } from "next/navigation"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { BancosEstadosCuentaView } from "@/presentation/components/bancos-estados-cuenta-view"
import type {
  AbonoCliente,
  CargoComision,
  Cuenta,
  GastoExterno,
  Movimiento,
  TransferenciaHijuelos,
  Traspaso,
} from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function EstadosCuentaPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [
    cuentas,
    movimientos,
    cargosComisiones,
    transferenciasHijuelos,
    traspasos,
    gastosExternos,
    abonosClientes,
  ] = await Promise.all([
    repository<Cuenta>("cuentas").findAll(),
    repository<Movimiento>("movimientos").findAll(),
    repository<CargoComision>("cargosComisiones").findAll(),
    repository<TransferenciaHijuelos>("transferenciasHijuelos").findAll(),
    repository<Traspaso>("traspasos").findAll(),
    repository<GastoExterno>("gastosExternos").findAll(),
    repository<AbonoCliente>("abonosClientes").findAll(),
  ])

  return (
    <BancosEstadosCuentaView
      cuentas={cuentas}
      movimientos={movimientos}
      cargosComisiones={cargosComisiones}
      transferenciasHijuelos={transferenciasHijuelos}
      traspasos={traspasos}
      gastosExternos={gastosExternos}
      abonosClientes={abonosClientes}
    />
  )
}
