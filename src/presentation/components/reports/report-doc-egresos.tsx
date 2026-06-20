﻿import type { EgresoMes } from "@/lib/accounting"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function EgresosDoc({
  generadoEl,
  folio,
  filtros,
  data,
}: {
  generadoEl: string
  folio: string
  filtros?: string
  data: EgresoMes[]
}) {
  const total = data.reduce((a, e) => a + e.total, 0)
  const pagado = data.reduce((a, e) => a + e.pagado, 0)
  return (
    <ReportDocument
      titulo="Egresos por periodo (cuentas por pagar)"
      generadoEl={generadoEl}
      folio={folio}
      filtros={filtros}
    >
      <ReportKpis
        items={[
          { label: "Total", value: mxn(total) },
          { label: "Pagado", value: mxn(pagado) },
          { label: "Pendiente", value: mxn(total - pagado) },
        ]}
      />
      <ReportTable
        columns={[
          { key: "mes", label: "Mes" },
          { key: "pagado", label: "Pagado", align: "right", width: 100 },
          { key: "pendiente", label: "Pendiente", align: "right", width: 100 },
          { key: "total", label: "Total", align: "right", width: 100 },
        ]}
        rows={data.map((e) => ({
          mes: e.mes,
          pagado: mxn(e.pagado),
          pendiente: mxn(e.pendiente),
          total: mxn(e.total),
        }))}
        total={{
          mes: "Total",
          pagado: mxn(pagado),
          pendiente: mxn(total - pagado),
          total: mxn(total),
        }}
      />
    </ReportDocument>
  )
}
