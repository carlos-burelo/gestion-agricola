import { formatDate } from "@/lib/dates"
import type { OrdenFila } from "@/presentation/reports-queries"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function OrdenesDoc({
  generadoEl,
  filtros,
  data,
}: {
  generadoEl: string
  filtros?: string
  data: OrdenFila[]
}) {
  const total = data.reduce((a, o) => a + o.total, 0)
  return (
    <ReportDocument
      titulo="Órdenes de compra"
      generadoEl={generadoEl}
      filtros={filtros}
    >
      <ReportKpis
        items={[
          { label: "Órdenes", value: data.length.toLocaleString("es-MX") },
          { label: "Monto total", value: mxn(total) },
          {
            label: "Promedio por orden",
            value: mxn(data.length ? total / data.length : 0),
          },
        ]}
      />
      <ReportTable
        columns={[
          { key: "folio", label: "Folio", width: 80 },
          { key: "fecha", label: "Fecha", width: 70 },
          { key: "proveedor", label: "Proveedor" },
          { key: "estado", label: "Estado", width: 90 },
          { key: "total", label: "Total", align: "right", width: 90 },
        ]}
        rows={data.map((o) => ({
          folio: o.folio,
          fecha: formatDate(o.fecha),
          proveedor: o.proveedor,
          estado: o.estado,
          total: mxn(o.total),
        }))}
        total={{ folio: "Total", total: mxn(total) }}
      />
    </ReportDocument>
  )
}
