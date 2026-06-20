import type { CosteoNivel } from "@/presentation/reports-queries"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function CosteoDoc({
  generadoEl,
  data,
}: {
  generadoEl: string
  data: CosteoNivel
}) {
  const manoObra = data.filas.reduce((a, f) => a + f.manoObra, 0)
  const insumos = data.filas.reduce((a, f) => a + f.insumos, 0)
  const total = manoObra + insumos
  return (
    <ReportDocument
      titulo="Costeo agrícola"
      subtitulo={data.titulo}
      generadoEl={generadoEl}
    >
      <ReportKpis
        items={[
          { label: "Mano de obra", value: mxn(manoObra) },
          { label: "Insumos", value: mxn(insumos) },
          { label: "Total", value: mxn(total) },
        ]}
      />
      <ReportTable
        columns={[
          { key: "concepto", label: "Concepto" },
          { key: "manoObra", label: "Mano de obra", align: "right", width: 100 },
          { key: "insumos", label: "Insumos", align: "right", width: 100 },
          { key: "total", label: "Total", align: "right", width: 100 },
        ]}
        rows={data.filas.map((f) => ({
          concepto: f.concepto,
          manoObra: mxn(f.manoObra),
          insumos: mxn(f.insumos),
          total: mxn(f.total),
        }))}
        total={{
          concepto: "Total",
          manoObra: mxn(manoObra),
          insumos: mxn(insumos),
          total: mxn(total),
        }}
      />
    </ReportDocument>
  )
}
