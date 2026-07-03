import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository, tesoreriaService } from "@/infrastructure/container"
import type { Cuenta } from "@/core/domain/entities"

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

      <form className="flex gap-2" method="get">
        <select name="mes" defaultValue={mes} className="rounded-md border px-3 py-2 text-sm">
          {MESES.map((nombre, i) => (
            <option key={nombre} value={i + 1}>{nombre}</option>
          ))}
        </select>
        <input name="anio" type="number" defaultValue={anio} className="w-28 rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Ver
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="sticky left-0 bg-muted/40 p-2">Categoría</th>
              {cuentas.map((c) => (
                <th key={c.id} className="p-2 text-right whitespace-nowrap">{c.nombre}</th>
              ))}
              <th className="p-2 text-right whitespace-nowrap font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {matriz.filas.map((f) => (
              <tr key={f.categoriaId} className="border-b last:border-0">
                <td
                  className="sticky left-0 bg-background p-2 whitespace-nowrap"
                  style={{ paddingLeft: `${8 + f.nivel * 16}px`, fontWeight: f.nivel === 0 ? 600 : 400 }}
                >
                  {f.nombre}
                </td>
                {cuentas.map((c) => (
                  <td key={c.id} className="p-2 text-right">
                    {f.porCuenta[c.id] ? fmt(f.porCuenta[c.id]) : "—"}
                  </td>
                ))}
                <td className="p-2 text-right font-medium">{fmt(f.total)}</td>
              </tr>
            ))}
            <tr className="border-t-2 font-semibold">
              <td className="sticky left-0 bg-background p-2">Total</td>
              {cuentas.map((c) => (
                <td key={c.id} className="p-2 text-right">{fmt(matriz.totalesPorCuenta[c.id] ?? 0)}</td>
              ))}
              <td className="p-2 text-right">{fmt(matriz.totalGeneral)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
