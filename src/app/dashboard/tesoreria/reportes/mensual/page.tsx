import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository, tesoreriaService } from "@/infrastructure/container"
import type { Cuenta } from "@/core/domain/entities"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default async function ReporteMensualPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>
}) {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  if (actor.rol !== "admin") redirect("/dashboard/tesoreria")

  const sp = await searchParams
  const hoy = new Date()
  const mes = Number(sp.mes ?? hoy.getUTCMonth() + 1)
  const anio = Number(sp.anio ?? hoy.getUTCFullYear())

  const [matriz, cuentas] = await Promise.all([
    tesoreriaService().reporteMensual(mes, anio),
    repository<Cuenta>("cuentas").findAll(),
  ])

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Matriz mensual" description="Categoría × cuenta, con totales." badge="Tesorería" />

      <form className="flex items-end gap-2" method="get">
        <Field className="w-40">
          <Select name="mes" defaultValue={String(mes)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MESES.map((nombre, i) => (
                  <SelectItem key={nombre} value={String(i + 1)}>{nombre}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-28">
          <Input name="anio" type="number" defaultValue={anio} />
        </Field>
        <Button type="submit">Ver</Button>
      </form>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-muted/40">Categoría</TableHead>
              {cuentas.map((c) => (
                <TableHead key={c.id} className="text-right">{c.nombre}</TableHead>
              ))}
              <TableHead className="text-right font-semibold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matriz.filas.map((f) => (
              <TableRow key={f.categoriaId}>
                <TableCell
                  className="sticky left-0 bg-background"
                  style={{ paddingLeft: `${8 + f.nivel * 16}px`, fontWeight: f.nivel === 0 ? 600 : 400 }}
                >
                  {f.nombre}
                </TableCell>
                {cuentas.map((c) => (
                  <TableCell key={c.id} className="text-right">
                    {f.porCuenta[c.id] ? fmt(f.porCuenta[c.id]) : "—"}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">{fmt(f.total)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 font-semibold">
              <TableCell className="sticky left-0 bg-background">Total</TableCell>
              {cuentas.map((c) => (
                <TableCell key={c.id} className="text-right">{fmt(matriz.totalesPorCuenta[c.id] ?? 0)}</TableCell>
              ))}
              <TableCell className="text-right">{fmt(matriz.totalGeneral)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
