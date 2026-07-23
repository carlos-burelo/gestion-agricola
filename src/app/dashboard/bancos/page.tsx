import { redirect } from "next/navigation"
import { BancosTablaView } from "@/presentation/components/bancos-tabla-view"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository, tesoreriaService } from "@/infrastructure/container"
import type { Categoria, Cuenta, Familiar, Movimiento, UsuarioCuenta } from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function BancosEstadoCuentaPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [cuentas, saldos, movimientos, categorias, familiares] = await Promise.all([
    repository<Cuenta>("cuentas").findAll(),
    tesoreriaService().saldosDeTodasLasCuentas(),
    repository<Movimiento>("movimientos").findAll(),
    repository<Categoria>("categorias").findAll(),
    repository<Familiar>("familiares").findAll(),
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
    <BancosTablaView
      cuentas={visibles}
      saldos={saldos}
      movimientosRecientes={movimientosRecientes}
      categorias={categorias}
      familiares={familiares}
      isAdmin={isAdmin}
    />
  )
}
