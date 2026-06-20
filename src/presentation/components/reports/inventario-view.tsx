import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { InventarioFila } from "@/presentation/reports-queries"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function InventarioView({
  inventario,
}: {
  inventario: InventarioFila[]
}) {
  const total = inventario.reduce((a, f) => a + f.valorInventario, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Existencia</TableHead>
            <TableHead className="text-right">Costo prom.</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventario.map((f, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{f.producto}</TableCell>
              <TableCell className="text-right tabular-nums">
                {f.existencia.toLocaleString("es-MX")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {currency(f.costoPromedio)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {currency(f.valorInventario)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell />
            <TableCell />
            <TableCell className="text-right tabular-nums">
              {currency(total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
