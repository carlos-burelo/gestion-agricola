import type { Producto } from "@/core/domain/entities"
import { repository } from "@/infrastructure/container"
import { PageHeader } from "@/presentation/components/page-header"
import { KardexView } from "@/presentation/components/kardex-view"

export default async function KardexPage() {
  const productos = await repository<Producto>("productos").findAll()
  const options = productos.map((p) => ({
    value: p.id,
    label: `${p.nombreComercial} (${p.ingredienteActivo})`,
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kardex de inventario"
        description="Control de existencias por método PEPS (primeras entradas, primeras salidas)."
      />
      <KardexView productos={options} />
    </div>
  )
}
