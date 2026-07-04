import Link from "next/link"
import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository, tesoreriaService } from "@/infrastructure/container"
import type { Cuenta, UsuarioCuenta } from "@/core/domain/entities"

export default async function TesoreriaPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [cuentas, saldos] = await Promise.all([
    repository<Cuenta>("cuentas").findAll(),
    tesoreriaService().saldosDeTodasLasCuentas(),
  ])

  let visibles = cuentas
  if (actor.rol === "persona") {
    const asignadas = await repository<UsuarioCuenta>("usuarioCuentas").findBy({ usuarioId: actor.usuarioId })
    const permitidas = new Set(asignadas.map((a) => a.cuentaId))
    visibles = cuentas.filter((c) => permitidas.has(c.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tesorería"
        description="Cuentas, saldos y movimientos."
        badge="Tesorería"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/tesoreria/${c.id}`}
            className="rounded-xl border p-4 transition hover:border-primary"
          >
            <p className="text-xs text-muted-foreground">{c.tipo} · {c.moneda}</p>
            <p className="font-medium">{c.nombre}</p>
            <p className="mt-2 text-lg font-semibold">
              {(saldos[c.id] ?? 0).toLocaleString("es-MX", { style: "currency", currency: c.moneda })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
