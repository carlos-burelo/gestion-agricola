﻿import { formatDate } from "@/lib/dates"
import type { KardexProducto } from "@/presentation/reports-queries"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function KardexDoc({
  generadoEl,
  folio,
  data,
}: {
  generadoEl: string
  folio: string
  data: KardexProducto
}) {
  const last = data.filas[data.filas.length - 1]
  const entradas = data.filas
    .filter((f) => f.tipo === "entrada")
    .reduce((a, f) => a + f.cantidad, 0)
  const salidas = data.filas
    .filter((f) => f.tipo === "salida")
    .reduce((a, f) => a + f.cantidad, 0)
  return (
    <ReportDocument
      titulo="Kardex PEPS"
      subtitulo={data.producto}
      generadoEl={generadoEl}
      folio={folio}
    >
      <ReportKpis
        items={[
          { label: "Existencia actual", value: (last?.saldoCantidad ?? 0).toLocaleString("es-MX") },
          { label: "Valor del saldo", value: mxn(last?.saldoImporte ?? 0) },
          { label: "Entradas / Salidas", value: `${entradas.toLocaleString("es-MX")} / ${salidas.toLocaleString("es-MX")}` },
        ]}
      />
      <ReportTable
        columns={[
          { key: "fecha", label: "Fecha", width: 66 },
          { key: "tipo", label: "Tipo", width: 56 },
          { key: "cantidad", label: "Cant.", align: "right", width: 50 },
          { key: "cu", label: "C. Unit.", align: "right", width: 64 },
          { key: "importe", label: "Importe", align: "right", width: 70 },
          { key: "saldoCant", label: "Saldo cant.", align: "right", width: 62 },
          { key: "saldoValor", label: "Saldo valor", align: "right", width: 74 },
        ]}
        rows={data.filas.map((f) => ({
          fecha: formatDate(f.fecha),
          tipo: f.tipo,
          cantidad: f.cantidad.toLocaleString("es-MX"),
          cu: mxn(f.costoUnitario),
          importe: mxn(f.importe),
          saldoCant: f.saldoCantidad.toLocaleString("es-MX"),
          saldoValor: mxn(f.saldoImporte),
        }))}
      />
    </ReportDocument>
  )
}
