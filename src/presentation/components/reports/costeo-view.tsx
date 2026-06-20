import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CosteoNivel } from "@/presentation/reports-queries"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function CosteoView({ data }: { data: CosteoNivel }) {
  const manoObra = data.filas.reduce((a, f) => a + f.manoObra, 0)
  const insumos = data.filas.reduce((a, f) => a + f.insumos, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead className="text-right">Mano de obra</TableHead>
            <TableHead className="text-right">Insumos</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.filas.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-muted-foreground"
              >
                Sin costos registrados en este nivel.
              </TableCell>
            </TableRow>
          ) : (
            data.filas.map((f) => (
              <TableRow key={f.concepto}>
                <TableCell className="font-medium">{f.concepto}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency(f.manoObra)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency(f.insumos)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {currency(f.total)}
                </TableCell>
              </TableRow>
            ))
          )}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(manoObra)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(insumos)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(manoObra + insumos)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
