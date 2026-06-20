import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EgresoMes } from "@/lib/accounting"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function EgresosView({ data }: { data: EgresoMes[] }) {
  const total = data.reduce((a, e) => a + e.total, 0)
  const pagado = data.reduce((a, e) => a + e.pagado, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mes</TableHead>
            <TableHead className="text-right">Pagado</TableHead>
            <TableHead className="text-right">Pendiente</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-muted-foreground"
              >
                Sin egresos en el periodo.
              </TableCell>
            </TableRow>
          ) : (
            data.map((e) => (
              <TableRow key={e.mes}>
                <TableCell className="font-medium">{e.mes}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency(e.pagado)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency(e.pendiente)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {currency(e.total)}
                </TableCell>
              </TableRow>
            ))
          )}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(pagado)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(total - pagado)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
