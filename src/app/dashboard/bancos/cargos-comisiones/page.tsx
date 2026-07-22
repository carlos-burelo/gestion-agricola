import { redirect } from "next/navigation"
import { CargosComisionesBancariasView } from "@/presentation/components/bancos/cargos-comisiones-form"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { CargoComisionBancaria, CatGastoFinanciero, Cuenta } from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function CargosComisionesPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [cuentas, catGastosFinancieros, cargosComisiones] = await Promise.all([
    repository<Cuenta>("cuentas").findAll(),
    repository<CatGastoFinanciero>("catGastosFinancieros").findAll(),
    repository<CargoComisionBancaria>("cargosComisiones").findAll(),
  ])

  // Sort cargos descending by date
  const cargosOrdenados = [...cargosComisiones].sort((a, b) =>
    b.fecha.localeCompare(a.fecha)
  )

  return (
    <CargosComisionesBancariasView
      cuentas={cuentas}
      catGastosFinancieros={catGastosFinancieros}
      cargosComisiones={cargosOrdenados}
    />
  )
}
