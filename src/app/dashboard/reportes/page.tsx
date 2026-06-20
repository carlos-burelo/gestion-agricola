import { PageHeader } from "@/presentation/components/page-header"
import { ReportesHub } from "@/presentation/components/reports/reportes-hub"
import { loadReportesContext } from "@/presentation/reports-queries"

export default async function ReportesPage() {
  const ctx = await loadReportesContext()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        badge="Análisis"
        title="Reportes"
        description="Contabilidad de cuentas por pagar e inventario. Filtra y descarga en PDF."
      />
      <ReportesHub ctx={ctx} />
    </div>
  )
}
