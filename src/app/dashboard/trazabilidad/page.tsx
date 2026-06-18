import type { Requerimiento } from "@/core/domain/entities"
import { repository } from "@/infrastructure/container"
import { PageHeader } from "@/presentation/components/page-header"
import { TraceView } from "@/presentation/components/trace-view"

export default async function TrazabilidadPage() {
  const reqs = await repository<Requerimiento>("requerimientos").findAll()
  const options = reqs.map((r) => ({
    value: r.id,
    label: `${r.folio} — ${r.solicitante} (${r.fecha})`,
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trazabilidad de compras"
        description="Sigue un insumo desde la solicitud hasta su aplicación en campo."
      />
      <TraceView requerimientos={options} />
    </div>
  )
}
