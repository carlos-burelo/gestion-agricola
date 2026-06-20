﻿import type { SemilleroFila } from "@/presentation/reports-queries"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function SemilleroDoc({
  generadoEl,
  folio,
  data,
}: {
  generadoEl: string
  folio: string
  data: SemilleroFila[]
}) {
  const costoTotal = data.reduce((a, f) => a + f.costoTotal, 0)
  const plantas = data.reduce((a, f) => a + f.plantas, 0)
  const unitario = plantas ? costoTotal / plantas : 0
  return (
    <ReportDocument
      titulo="Costo de planta de semillero"
      subtitulo="Costo unitario por planta producida"
      generadoEl={generadoEl}
      folio={folio}
    >
      <ReportKpis
        items={[
          { label: "Costo total", value: mxn(costoTotal) },
          { label: "Plantas producidas", value: plantas.toLocaleString("es-MX") },
          { label: "Costo unitario prom.", value: mxn(unitario) },
        ]}
      />
      <ReportTable
        columns={[
          { key: "semillero", label: "Semillero" },
          { key: "costo", label: "Costo total", align: "right", width: 100 },
          { key: "plantas", label: "Plantas", align: "right", width: 90 },
          { key: "unitario", label: "Costo unitario", align: "right", width: 100 },
        ]}
        rows={data.map((f) => ({
          semillero: f.semillero,
          costo: mxn(f.costoTotal),
          plantas: f.plantas.toLocaleString("es-MX"),
          unitario: mxn(f.costoUnitario),
        }))}
        total={{
          semillero: "Total",
          costo: mxn(costoTotal),
          plantas: plantas.toLocaleString("es-MX"),
          unitario: mxn(unitario),
        }}
      />
    </ReportDocument>
  )
}
