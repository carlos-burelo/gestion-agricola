import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { RecordTable } from "@/presentation/components/record-table"
import { RecordForm } from "@/presentation/components/record-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getModuleBySlug } from "@/presentation/config/modules"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { loadRecords, loadReferenceOptions, loadLabelMap } from "@/presentation/queries"

export const dynamic = "force-dynamic"

export default async function VentasPinaPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const config = getModuleBySlug("ventas-pina")!
  const [records, referenceOptions, labelMap] = await Promise.all([
    loadRecords(config.collection),
    loadReferenceOptions(config),
    loadLabelMap(config),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        badge="Módulo de Clientes"
        title="Ventas de Piña"
        description="Registro de liquidaciones de fruta, kilos cosechados, precio por kg y forma de pago."
      >
        <RecordForm
          config={config}
          referenceOptions={referenceOptions}
          trigger={
            <Button className="gap-1.5 shadow-xs">
              <Plus className="size-4" />
              <span>Nueva Venta de Piña</span>
            </Button>
          }
        />
      </PageHeader>
      <RecordTable
        config={config}
        records={records as unknown as Record<string, unknown>[]}
        referenceOptions={referenceOptions}
        labelMap={labelMap}
      />
    </div>
  )
}
