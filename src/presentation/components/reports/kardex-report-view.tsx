import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/dates"
import type { KardexProducto } from "@/presentation/reports-queries"
import { StatusBadge } from "@/presentation/components/status-badge"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(n)

export function KardexReportView({ data }: { data: KardexProducto }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Cant.</TableHead>
            <TableHead className="text-right">C. Unit.</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead className="text-right">Saldo cant.</TableHead>
            <TableHead className="text-right">Saldo valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.filas.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-8 text-center text-muted-foreground"
              >
                Sin movimientos para este producto.
              </TableCell>
            </TableRow>
          ) : (
            data.filas.map((f) => (
              <TableRow key={f.movimientoId}>
                <TableCell>{formatDate(f.fecha)}</TableCell>
                <TableCell>
                  <StatusBadge estado={f.tipo} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.cantidad.toLocaleString("es-MX")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency(f.costoUnitario)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency(f.importe)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.saldoCantidad.toLocaleString("es-MX")}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {currency(f.saldoImporte)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
