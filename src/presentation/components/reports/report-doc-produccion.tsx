﻿import type { ProduccionMes } from "@/presentation/reports-queries"
import { ReportDocument, ReportKpis, ReportTable } from "./report-shell"

const num = (n: number) => n.toLocaleString("es-MX")

export function ProduccionDoc({
  generadoEl,
  folio,
  filtros,
  data,
}: {
  generadoEl: string
  folio: string
  filtros?: string
  data: ProduccionMes[]
}) {
  const sembradas = data.reduce((a, e) => a + e.sembradas, 0)
  const producidas = data.reduce((a, e) => a + e.producidas, 0)
  return (
    <ReportDocument
      titulo="Producción de plantas"
      subtitulo="Plantas sembradas y producidas por mes"
      generadoEl={generadoEl}
      folio={folio}
      filtros={filtros}
    >
      <ReportKpis
        items={[
          { label: "Sembradas", value: num(sembradas) },
          { label: "Producidas (semillero)", value: num(producidas) },
          { label: "Meses con actividad", value: num(data.length) },
        ]}
      />
      <ReportTable
        columns={[
          { key: "mes", label: "Mes" },
          { key: "sembradas", label: "Sembradas", align: "right", width: 120 },
          { key: "producidas", label: "Producidas", align: "right", width: 120 },
        ]}
        rows={data.map((e) => ({
          mes: e.mes,
          sembradas: num(e.sembradas),
          producidas: num(e.producidas),
        }))}
        total={{
          mes: "Total",
          sembradas: num(sembradas),
          producidas: num(producidas),
        }}
      />
    </ReportDocument>
  )
}
