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

export default async function PrestamosExternosPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const config = getModuleBySlug("prestamos-externos")!
  const [records, referenceOptions, labelMap] = await Promise.all([
    loadRecords(config.collection),
    loadReferenceOptions(config),
    loadLabelMap(config),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        badge="Módulo de Bancos"
        title="(e) Préstamos de Externos"
        description="Entradas de dinero prestado por personas físicas o socios externos."
      >
        <RecordForm
          config={config}
          referenceOptions={referenceOptions}
          trigger={
            <Button className="gap-1.5 shadow-xs">
              <Plus className="size-4" />
              <span>Nuevo Préstamo Externo</span>
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
