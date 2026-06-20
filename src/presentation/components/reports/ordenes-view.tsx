import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/dates"
import type { OrdenFila } from "@/presentation/reports-queries"
import { StatusBadge } from "@/presentation/components/status-badge"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function OrdenesView({ data }: { data: OrdenFila[] }) {
  const total = data.reduce((a, o) => a + o.total, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
              >
                Sin órdenes con esos filtros.
              </TableCell>
            </TableRow>
          ) : (
            data.map((o, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{o.folio}</TableCell>
                <TableCell>{formatDate(o.fecha)}</TableCell>
                <TableCell>{o.proveedor}</TableCell>
                <TableCell>
                  <StatusBadge estado={o.estado} />
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {currency(o.total)}
                </TableCell>
              </TableRow>
            ))
          )}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
