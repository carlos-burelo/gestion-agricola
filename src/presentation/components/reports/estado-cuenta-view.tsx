import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EstadoCuentaReporte } from "@/lib/accounting"
import { formatDate } from "@/lib/dates"
import { StatusBadge } from "@/presentation/components/status-badge"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function EstadoCuentaView({ data }: { data: EstadoCuentaReporte }) {
  const t = data.totales
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Facturado", t.facturado],
            ["Pagado", t.pagado],
            ["Pendiente", t.pendiente],
            ["Vencido", t.vencido],
          ] as const
        ).map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-lg font-semibold tabular-nums">{currency(v)}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Importe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.filas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Sin movimientos para este proveedor.
                </TableCell>
              </TableRow>
            ) : (
              data.filas.map((f, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {f.factura || "—"}
                  </TableCell>
                  <TableCell>{formatDate(f.fecha)}</TableCell>
                  <TableCell>{formatDate(f.vencimiento)}</TableCell>
                  <TableCell>
                    <StatusBadge estado={f.estado} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {currency(f.importe)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
