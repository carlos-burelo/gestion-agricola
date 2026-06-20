import type { InventarioFila } from "@/presentation/reports-queries"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function InventarioDoc({
  generadoEl,
  inventario,
}: {
  generadoEl: string
  inventario: InventarioFila[]
}) {
  const valorTotal = inventario.reduce((a, f) => a + f.valorInventario, 0)
  const unidades = inventario.reduce((a, f) => a + f.existencia, 0)
  return (
    <ReportDocument titulo="Inventario valorizado (PEPS)" generadoEl={generadoEl}>
      <ReportKpis
        items={[
          { label: "Valor total en almacén", value: mxn(valorTotal) },
          {
            label: "Productos",
            value: inventario.length.toLocaleString("es-MX"),
          },
          { label: "Unidades", value: unidades.toLocaleString("es-MX") },
        ]}
      />
      <ReportTable
        columns={[
          { key: "producto", label: "Producto" },
          { key: "existencia", label: "Existencia", align: "right", width: 80 },
          { key: "costo", label: "Costo prom.", align: "right", width: 90 },
          { key: "valor", label: "Valor", align: "right", width: 90 },
        ]}
        rows={inventario.map((f) => ({
          producto: f.producto,
          existencia: f.existencia.toLocaleString("es-MX"),
          costo: mxn(f.costoPromedio),
          valor: mxn(f.valorInventario),
        }))}
        total={{ producto: "Total", valor: mxn(valorTotal) }}
      />
    </ReportDocument>
  )
}
