import { PageHeader } from "@/presentation/components/page-header"
import { FieldMapLoader } from "@/presentation/components/field-map-loader"
import { loadParcelasMapa } from "@/presentation/geo-queries"

export default async function MapaPage() {
  const parcelas = await loadParcelasMapa()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        badge="Análisis"
        title="Mapa de parcelas"
        description="Vista satelital de las parcelas. Haz clic en una para ver sus costos; usa Editar límites para dibujar su polígono."
      />
      <FieldMapLoader parcelas={parcelas} />
    </div>
  )
}
