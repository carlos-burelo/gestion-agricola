import { redirect } from "next/navigation"
import { TransferenciasBancariasView } from "@/presentation/components/bancos/transferencias-form"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { Cuenta, Traspaso, TransferenciaHijuelos } from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function TransferenciasBancariasPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [cuentas, traspasos, transferenciasHijuelos] = await Promise.all([
    repository<Cuenta>("cuentas").findAll(),
    repository<Traspaso>("traspasos").findAll(),
    repository<TransferenciaHijuelos>("transferenciasHijuelos").findAll(),
  ])

  // Sort traspasos descending by date
  const traspasosOrdenados = [...traspasos].sort((a, b) =>
    b.fecha.localeCompare(a.fecha)
  )

  return (
    <TransferenciasBancariasView
      cuentas={cuentas}
      traspasos={traspasosOrdenados}
      transferenciasHijuelos={transferenciasHijuelos}
    />
  )
}
