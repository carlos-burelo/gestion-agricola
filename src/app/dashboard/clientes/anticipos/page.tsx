import { redirect } from "next/navigation"
import { AnticiposVentaPinaView } from "@/presentation/components/clientes/anticipos-form"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { AnticipoCliente, Cliente, Cuenta } from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function AnticiposVentaPinaPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [clientes, cuentas, anticipos] = await Promise.all([
    repository<Cliente>("clientes").findAll(),
    repository<Cuenta>("cuentas").findAll(),
    repository<AnticipoCliente>("anticiposClientes").findAll(),
  ])

  // Sort anticipos descending by date
  const anticiposOrdenados = [...anticipos].sort((a, b) =>
    b.fecha.localeCompare(a.fecha)
  )

  return (
    <AnticiposVentaPinaView
      clientes={clientes}
      cuentas={cuentas}
      anticipos={anticiposOrdenados}
    />
  )
}
