import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AgingReporte } from "@/lib/accounting"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

const COLS = [
  ["porVencer", "Por vencer"],
  ["d1_30", "1–30"],
  ["d31_60", "31–60"],
  ["d61_90", "61–90"],
  ["d90", "+90"],
  ["total", "Total"],
] as const

export function AgingView({ data }: { data: AgingReporte }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proveedor</TableHead>
            {COLS.map(([k, l]) => (
              <TableHead key={k} className="text-right">
                {l}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.filas.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLS.length + 1}
                className="py-8 text-center text-muted-foreground"
              >
                Sin saldos pendientes.
              </TableCell>
            </TableRow>
          ) : (
            data.filas.map((f) => (
              <TableRow key={f.proveedor}>
                <TableCell className="font-medium">{f.proveedor}</TableCell>
                {COLS.map(([k]) => (
                  <TableCell key={k} className="text-right tabular-nums">
                    {currency(f[k])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            {COLS.map(([k]) => (
              <TableCell key={k} className="text-right tabular-nums">
                {currency(data.totales[k])}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
