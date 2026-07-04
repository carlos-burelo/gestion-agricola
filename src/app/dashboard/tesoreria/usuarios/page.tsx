import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { Cuenta, Usuario, UsuarioCuenta } from "@/core/domain/entities"
import { crearUsuario } from "./actions"

export default async function UsuariosPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  if (actor.rol !== "admin") redirect("/dashboard/tesoreria")

  const [usuarios, cuentas, usuarioCuentas] = await Promise.all([
    repository<Usuario>("usuarios").findAll(),
    repository<Cuenta>("cuentas").findAll(),
    repository<UsuarioCuenta>("usuarioCuentas").findAll(),
  ])
  const cuentasPorUsuario = new Map<string, string[]>()
  for (const uc of usuarioCuentas) {
    const lista = cuentasPorUsuario.get(uc.usuarioId) ?? []
    lista.push(cuentas.find((c) => c.id === uc.cuentaId)?.nombre ?? uc.cuentaId)
    cuentasPorUsuario.set(uc.usuarioId, lista)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Acceso al sistema de tesorería: quién puede capturar qué cuenta."
        badge="Tesorería"
      />
      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-2">Nombre</th>
              <th className="p-2">Correo</th>
              <th className="p-2">Rol</th>
              <th className="p-2">Cuentas asignadas</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-2">{u.nombre}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.rol}</td>
                <td className="p-2">
                  {u.rol === "admin" ? "Todas" : (cuentasPorUsuario.get(u.id) ?? []).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={crearUsuario} className="max-w-lg space-y-3 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Nuevo usuario</h2>
        <input name="nombre" placeholder="Nombre" required className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Correo" required className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="password" type="password" placeholder="Contraseña (mín. 8 caracteres)" required minLength={8} className="w-full rounded-md border px-3 py-2 text-sm" />
        <select name="rol" className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="persona">Persona (solo sus cuentas)</option>
          <option value="admin">Admin (todas las cuentas)</option>
        </select>
        <fieldset className="space-y-1">
          <legend className="text-xs text-muted-foreground">Cuentas (solo aplica a rol persona)</legend>
          {cuentas.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="cuentaIds" value={c.id} />
              {c.nombre}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Crear usuario
        </button>
      </form>
    </div>
  )
}
