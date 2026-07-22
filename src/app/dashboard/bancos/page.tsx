import { redirect } from "next/navigation"
import { BankingDashboard } from "@/presentation/components/banking-dashboard"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository, tesoreriaService } from "@/infrastructure/container"
import type { Categoria, Cuenta, Movimiento, UsuarioCuenta } from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function BancosEstadoCuentaPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [cuentas, saldos, movimientos, categorias] = await Promise.all([
    repository<Cuenta>("cuentas").findAll(),
    tesoreriaService().saldosDeTodasLasCuentas(),
    repository<Movimiento>("movimientos").findAll(),
    repository<Categoria>("categorias").findAll(),
  ])

  let visibles = cuentas
  if (actor.rol === "persona") {
    const asignadas = await repository<UsuarioCuenta>("usuarioCuentas").findBy({
      usuarioId: actor.usuarioId,
    })
    const permitidas = new Set(asignadas.map((a) => a.cuentaId))
    visibles = cuentas.filter((c) => permitidas.has(c.id))
  }

  const movimientosRecientes = [...movimientos].sort((a, b) =>
    b.fecha.localeCompare(a.fecha)
  )

  const isAdmin = actor.rol === "admin"

  return (
    <BankingDashboard
      cuentas={visibles}
      saldos={saldos}
      movimientosRecientes={movimientosRecientes}
      categorias={categorias}
      isAdmin={isAdmin}
    />
  )
}
