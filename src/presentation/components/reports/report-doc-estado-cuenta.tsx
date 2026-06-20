﻿import type { EstadoCuentaReporte } from "@/lib/accounting"
import { formatDate } from "@/lib/dates"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function EstadoCuentaDoc({
  generadoEl,
  folio,
  filtros,
  data,
}: {
  generadoEl: string
  folio: string
  filtros?: string
  data: EstadoCuentaReporte
}) {
  const t = data.totales
  return (
    <ReportDocument
      titulo="Estado de cuenta por proveedor"
      subtitulo={data.proveedor}
      generadoEl={generadoEl}
      folio={folio}
      filtros={filtros}
    >
      <ReportKpis
        items={[
          { label: "Facturado", value: mxn(t.facturado) },
          { label: "Pagado", value: mxn(t.pagado) },
          { label: "Pendiente + vencido", value: mxn(t.pendiente + t.vencido) },
        ]}
      />
      <ReportTable
        columns={[
          { key: "factura", label: "Factura", width: 90 },
          { key: "fecha", label: "Fecha", width: 70 },
          { key: "vencimiento", label: "Vence", width: 70 },
          { key: "estado", label: "Estado", width: 70 },
          { key: "importe", label: "Importe", align: "right" },
        ]}
        rows={data.filas.map((f) => ({
          factura: f.factura || "â€”",
          fecha: formatDate(f.fecha),
          vencimiento: formatDate(f.vencimiento),
          estado: f.estado,
          importe: mxn(f.importe),
        }))}
        total={{ factura: "Total", importe: mxn(t.facturado) }}
      />
    </ReportDocument>
  )
}
