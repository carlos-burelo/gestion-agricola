import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { BankCard } from "@/presentation/components/bank-card"
import { CapturarMovimientoDialog } from "@/presentation/components/capturar-movimiento-dialog"
import { formatDate } from "@/lib/dates"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { calcularSaldo } from "@/core/application/tesoreria-calc"
import type { Categoria, Cuenta, Movimiento, UsuarioCuenta } from "@/core/domain/entities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  const saldoActualTotal = saldoCorrido
  const categoriasHoja = categorias.filter((c) => categorias.every((h) => h.parentId !== c.id))
  const capturarConCuenta = capturarMovimiento.bind(null, cuentaId)
  const isAdmin = actor.rol === "admin"

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Page Header with Modal Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={`Estado de Cuenta: ${cuenta.nombre}`}
          description="Detalle de movimientos, saldo corrido y capturas bancarias."
          badge="Tesorería"
        />

        <CapturarMovimientoDialog
          cuentaId={cuentaId}
          cuentaNombre={cuenta.nombre}
          categoriasHoja={categoriasHoja}
          action={capturarConCuenta}
        />
      </div>

      {/* Top Banking Hero Header with BankCard */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-1">
          <BankCard
            cuenta={cuenta}
            saldoCalculado={saldoActualTotal}
            readOnly={!isAdmin}
          />
        </div>

        {/* Account Info Stats Card */}
        <div className="lg:col-span-2">
          <Card className="h-full border-muted/80 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Resumen de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 pt-2">
              <div className="rounded-xl border bg-muted/30 p-3">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">Saldo Inicial</span>
                <p className="text-base font-bold text-foreground">
                  {cuenta.saldoInicial.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
                </p>
              </div>

              <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/20 p-3">
                <span className="text-[11px] font-semibold uppercase text-emerald-600">Saldo Actual Real</span>
                <p className="text-base font-extrabold text-emerald-700">
                  {saldoActualTotal.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-3">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">Movimientos</span>
                <p className="text-base font-bold text-foreground">{filas.length} registros</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Width Transactions Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Libro Mayor de Movimientos</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs font-bold">Fecha</TableHead>
                <TableHead className="text-xs font-bold">Categoría</TableHead>
                <TableHead className="text-xs font-bold">Beneficiario / Concepto</TableHead>
                <TableHead className="text-xs font-bold text-right">Entrada (+)</TableHead>
                <TableHead className="text-xs font-bold text-right">Salida (-)</TableHead>
                <TableHead className="text-xs font-bold text-right">Saldo Corrido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              <TableRow className="bg-muted/20 font-medium">
                <TableCell colSpan={5}>Saldo Inicial de Apertura</TableCell>
                <TableCell className="text-right font-bold">
                  {cuenta.saldoInicial.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
                </TableCell>
              </TableRow>
              {filas.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/30 transition">
                  <TableCell className="font-medium">{formatDate(m.fecha)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
                      {m.traspasoId ? "Traspaso" : nombreCategoria.get(m.categoriaId) ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{m.beneficiario || "—"}</span>
                      {m.descripcion && <span className="text-[11px] text-muted-foreground">{m.descripcion}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {m.direccion === "entrada" ? `+${m.monto.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}` : ""}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-rose-600">
                    {m.direccion === "salida" ? `-${m.monto.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}` : ""}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {m.saldoCorrido.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
