import { redirect } from "next/navigation"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { loadRecords } from "@/presentation/queries"
import { OtrosGastosView } from "@/presentation/components/otros-gastos-view"
import type {
  CatGastoAdministrativo,
  CatGastoFamilia,
  CatGastoOperativo,
  Cuenta,
  Familiar,
  GastoExterno,
} from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function OtrosGastosPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [
    gastos,
    catFamilia,
    catOperativos,
    catAdministrativos,
    familiares,
    cuentas,
  ] = await Promise.all([
    loadRecords<GastoExterno>("gastosExternos"),
    loadRecords<CatGastoFamilia>("catGastosFamilia"),
    loadRecords<CatGastoOperativo>("catGastosOperativos"),
    loadRecords<CatGastoAdministrativo>("catGastosAdministrativos"),
    loadRecords<Familiar>("familiares"),
    loadRecords<Cuenta>("cuentas"),
  ])

  return (
    <OtrosGastosView
      gastos={gastos}
      catFamilia={catFamilia}
      catOperativos={catOperativos}
      catAdministrativos={catAdministrativos}
      familiares={familiares}
      cuentas={cuentas}
    />
  )
}
