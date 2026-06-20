import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SemilleroFila } from "@/presentation/reports-queries"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(n)

export function SemilleroView({ data }: { data: SemilleroFila[] }) {
  const costoTotal = data.reduce((a, f) => a + f.costoTotal, 0)
  const plantas = data.reduce((a, f) => a + f.plantas, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Semillero</TableHead>
            <TableHead className="text-right">Costo total</TableHead>
            <TableHead className="text-right">Plantas</TableHead>
            <TableHead className="text-right">Costo unitario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((f, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{f.semillero}</TableCell>
              <TableCell className="text-right tabular-nums">
                {currency(f.costoTotal)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {f.plantas.toLocaleString("es-MX")}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {currency(f.costoUnitario)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(costoTotal)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {plantas.toLocaleString("es-MX")}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(plantas ? costoTotal / plantas : 0)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
