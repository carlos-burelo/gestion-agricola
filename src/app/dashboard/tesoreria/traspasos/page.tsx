import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { TraspasoFormClient } from "@/presentation/components/traspaso-form-client"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository, tesoreriaService } from "@/infrastructure/container"
import type { Cuenta } from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function TraspasosPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  if (actor.rol !== "admin") redirect("/dashboard/tesoreria")

  const [cuentas, saldos] = await Promise.all([
    repository<Cuenta>("cuentas").findAll(),
    tesoreriaService().saldosDeTodasLasCuentas(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Traspasos entre Cuentas"
        description="Selección gráfica e interactiva de tarjetas bancarias para mover capital en un solo paso."
        badge="Tesorería"
      />
      <TraspasoFormClient cuentas={cuentas} saldos={saldos} />
    </div>
  )
}
