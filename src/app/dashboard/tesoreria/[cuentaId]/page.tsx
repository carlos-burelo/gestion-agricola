import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { formatDate, toDateInput } from "@/lib/dates"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { calcularSaldo } from "@/core/application/tesoreria-calc"
import type { Categoria, Cuenta, Movimiento, UsuarioCuenta } from "@/core/domain/entities"
import { capturarMovimiento } from "./actions"

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

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-2">Fecha</th>
              <th className="p-2">Categoría</th>
              <th className="p-2">Beneficiario</th>
              <th className="p-2 text-right">Entrada</th>
              <th className="p-2 text-right">Salida</th>
              <th className="p-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b bg-muted/20">
              <td className="p-2" colSpan={5}>Saldo inicial</td>
              <td className="p-2 text-right">
                {cuenta.saldoInicial.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
              </td>
            </tr>
            {filas.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="p-2">{formatDate(m.fecha)}</td>
                <td className="p-2">{m.traspasoId ? "Traspaso" : nombreCategoria.get(m.categoriaId) ?? "—"}</td>
                <td className="p-2">{m.beneficiario || "—"}</td>
                <td className="p-2 text-right">
                  {m.direccion === "entrada" ? m.monto.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda }) : ""}
                </td>
                <td className="p-2 text-right">
                  {m.direccion === "salida" ? m.monto.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda }) : ""}
                </td>
                <td className="p-2 text-right">
                  {m.saldoCorrido.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={capturarConCuenta} className="max-w-xl space-y-3 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Capturar movimiento</h2>
        <input name="fecha" type="date" defaultValue={toDateInput()} required className="w-full rounded-md border px-3 py-2 text-sm" />
        <select name="direccion" required className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
        </select>
        <select name="categoriaId" required className="w-full rounded-md border px-3 py-2 text-sm">
          {categoriasHoja.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <input name="monto" type="number" step="0.01" min="0.01" required placeholder="Monto" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="beneficiario" placeholder="Beneficiario" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="referencia" placeholder="Referencia" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="folio" placeholder="Folio" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="descripcion" placeholder="Descripción" className="w-full rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Guardar
        </button>
      </form>
    </div>
  )
}
