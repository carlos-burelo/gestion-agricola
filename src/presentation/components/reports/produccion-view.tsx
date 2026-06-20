import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ProduccionMes } from "@/presentation/reports-queries"

const num = (n: number) => n.toLocaleString("es-MX")

export function ProduccionView({ data }: { data: ProduccionMes[] }) {
  const sembradas = data.reduce((a, e) => a + e.sembradas, 0)
  const producidas = data.reduce((a, e) => a + e.producidas, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mes</TableHead>
            <TableHead className="text-right">Sembradas</TableHead>
            <TableHead className="text-right">Producidas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="py-8 text-center text-muted-foreground"
              >
                Sin producción en el periodo.
              </TableCell>
            </TableRow>
          ) : (
            data.map((e) => (
              <TableRow key={e.mes}>
                <TableCell className="font-medium">{e.mes}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {num(e.sembradas)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {num(e.producidas)}
                </TableCell>
              </TableRow>
            ))
          )}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {num(sembradas)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {num(producidas)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
