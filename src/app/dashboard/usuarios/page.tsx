import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { UserManagementView } from "@/presentation/components/user-management-view"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { Cuenta, Usuario, UsuarioCuenta } from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function UsuariosSystemPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  if (actor.rol !== "admin") redirect("/dashboard")

  const [usuarios, cuentas, usuarioCuentas] = await Promise.all([
    repository<Usuario>("usuarios").findAll(),
    repository<Cuenta>("cuentas").findAll(),
    repository<UsuarioCuenta>("usuarioCuentas").findAll(),
  ])

  const cuentasPorUsuarioMap: Record<string, string[]> = {}
  for (const uc of usuarioCuentas) {
    if (!cuentasPorUsuarioMap[uc.usuarioId]) {
      cuentasPorUsuarioMap[uc.usuarioId] = []
    }
    cuentasPorUsuarioMap[uc.usuarioId].push(uc.cuentaId)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administración de Usuarios"
        description="Seguridad y accesos del sistema: roles de usuario y permisos sobre cuentas bancarias."
        badge="Sistema"
      />
      <UserManagementView
        usuarios={usuarios}
        cuentas={cuentas}
        cuentasPorUsuarioMap={cuentasPorUsuarioMap}
      />
    </div>
  )
}
