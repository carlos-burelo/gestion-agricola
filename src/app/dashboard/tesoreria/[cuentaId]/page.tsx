import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { formatDate, toDateInput } from "@/lib/dates"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { calcularSaldo } from "@/core/application/tesoreria-calc"
import type { Categoria, Cuenta, Movimiento, UsuarioCuenta } from "@/core/domain/entities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { capturarMovimiento } from "./actions"

export const dynamic = "force-dynamic"

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ cuentaId: string }>
}) {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  const { cuentaId } = await params

  const cuenta = await repository<Cuenta>("cuentas").findById(cuentaId)
  if (!cuenta) notFound()

  if (actor.rol === "persona") {
    const asignadas = await repository<UsuarioCuenta>("usuarioCuentas").findBy({ usuarioId: actor.usuarioId })
    if (!asignadas.some((a) => a.cuentaId === cuentaId)) notFound()
  }

  const [movimientos, categorias] = await Promise.all([
    repository<Movimiento>("movimientos").findBy({ cuentaId }),
    repository<Categoria>("categorias").findAll(),
  ])
  const ordenados = [...movimientos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]))

  let saldoCorrido = cuenta.saldoInicial
  const filas = ordenados.map((m) => {
    saldoCorrido = calcularSaldo(saldoCorrido, [m])
    return { ...m, saldoCorrido }
  })

  const categoriasHoja = categorias.filter((c) => categorias.every((h) => h.parentId !== c.id))
  const capturarConCuenta = capturarMovimiento.bind(null, cuentaId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={cuenta.nombre} description={`${cuenta.tipo} · ${cuenta.moneda}`} badge="Tesorería" />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Beneficiario</TableHead>
              <TableHead className="text-right">Entrada</TableHead>
              <TableHead className="text-right">Salida</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/20">
              <TableCell colSpan={5}>Saldo inicial</TableCell>
              <TableCell className="text-right">
                {cuenta.saldoInicial.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
              </TableCell>
            </TableRow>
            {filas.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{formatDate(m.fecha)}</TableCell>
                <TableCell>{m.traspasoId ? "Traspaso" : nombreCategoria.get(m.categoriaId) ?? "—"}</TableCell>
                <TableCell>{m.beneficiario || "—"}</TableCell>
                <TableCell className="text-right">
                  {m.direccion === "entrada" ? m.monto.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda }) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {m.direccion === "salida" ? m.monto.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda }) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {m.saldoCorrido.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Capturar movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={capturarConCuenta}>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
                <Input id="fecha" name="fecha" type="date" defaultValue={toDateInput()} required />
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
                <Select name="direccion" defaultValue="entrada">
                  <SelectTrigger id="direccion" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="salida">Salida</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="categoriaId">Categoría</FieldLabel>
                <Select name="categoriaId">
                  <SelectTrigger id="categoriaId" className="w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categoriasHoja.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="monto">Monto</FieldLabel>
                <Input id="monto" name="monto" type="number" step="0.01" min="0.01" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="beneficiario">Beneficiario</FieldLabel>
                <Input id="beneficiario" name="beneficiario" />
              </Field>
              <Field>
                <FieldLabel htmlFor="referencia">Referencia</FieldLabel>
                <Input id="referencia" name="referencia" />
              </Field>
              <Field>
                <FieldLabel htmlFor="folio">Folio</FieldLabel>
                <Input id="folio" name="folio" />
              </Field>
              <Field>
                <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
                <Input id="descripcion" name="descripcion" />
              </Field>
              <Field>
                <Button type="submit">Guardar</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
