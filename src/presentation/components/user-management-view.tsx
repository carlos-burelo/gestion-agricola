"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  CheckCircle2,
  KeyRound,
  Lock,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import type { Cuenta, Usuario } from "@/core/domain/entities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect as SelectNative } from "@/components/ui/native-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { crearUsuarioAction, actualizarPermisosCuentasAction } from "@/presentation/actions/user-actions"

export interface UserManagementViewProps {
  usuarios: Usuario[]
  cuentas: Cuenta[]
  cuentasPorUsuarioMap: Record<string, string[]> // usuarioId -> cuentaId[]
}

/**
 * State-of-the-art User Management & Permissions View.
 * Elevated UX for managing users, roles, passwords, and assigned bank accounts.
 */
export function UserManagementView({
  usuarios,
  cuentas,
  cuentasPorUsuarioMap,
}: UserManagementViewProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPermissionsUserId, setEditingPermissionsUserId] = useState<string | null>(null)

  // Create User Form State
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rol, setRol] = useState<"admin" | "persona">("persona")
  const [selectedCuentaIds, setSelectedCuentaIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Permissions Modal State
  const [tempCuentaIds, setTempCuentaIds] = useState<string[]>([])

  const totalAdmins = usuarios.filter((u) => u.rol === "admin").length
  const totalOperadores = usuarios.filter((u) => u.rol === "persona").length

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !email.trim() || password.length < 8) {
      toast.error("Ingresa nombre, correo y contraseña (mínimo 8 caracteres)")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await crearUsuarioAction({
        nombre,
        email,
        password,
        rol,
        cuentaIds: rol === "persona" ? selectedCuentaIds : [],
      })

      if (res.ok) {
        toast.success("Usuario creado exitosamente")
        setIsCreateOpen(false)
        setNombre("")
        setEmail("")
        setPassword("")
        setSelectedCuentaIds([])
        router.refresh()
      } else {
        toast.error(res.error || "Error al crear usuario")
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al procesar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openPermissionsModal = (usuarioId: string) => {
    setEditingPermissionsUserId(usuarioId)
    setTempCuentaIds(cuentasPorUsuarioMap[usuarioId] ?? [])
  }

  const handleSavePermissions = async () => {
    if (!editingPermissionsUserId) return
    setIsSubmitting(true)
    try {
      const res = await actualizarPermisosCuentasAction(
        editingPermissionsUserId,
        tempCuentaIds
      )
      if (res.ok) {
        toast.success("Permisos de cuentas actualizados correctamente")
        setEditingPermissionsUserId(null)
        router.refresh()
      } else {
        toast.error(res.error || "Error al actualizar permisos")
      }
    } catch {
      toast.error("Error inesperado al guardar permisos")
    } finally {
      setIsSubmitting(false)
    }
  }

  const editingUser = usuarios.find((u) => u.id === editingPermissionsUserId)

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Stats & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Control de Usuarios y Accesos
            </h2>
            <p className="text-xs text-muted-foreground">
              Asignación de roles y matriz de permisos para cuentas bancarias.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="py-1">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-blue-500" />
              {totalAdmins} Admins
            </Badge>
            <Badge variant="secondary" className="py-1">
              <UserCheck className="mr-1 h-3.5 w-3.5 text-emerald-500" />
              {totalOperadores} Operadores
            </Badge>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="font-semibold shadow-xs"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* User Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {usuarios.map((u) => {
          const assignedIds = cuentasPorUsuarioMap[u.id] ?? []
          const assignedAccounts = cuentas.filter((c) => assignedIds.includes(c.id))
          const isAdmin = u.rol === "admin"

          return (
            <Card key={u.id} className="relative overflow-hidden shadow-xs hover:shadow-xs transition">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-extrabold text-sm uppercase shadow-xs">
                      {u.nombre.slice(0, 2)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold truncate">
                        {u.nombre}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>

                  <Badge
                    variant={isAdmin ? "default" : "secondary"}
                    className="text-[10px] uppercase font-bold"
                  >
                    {isAdmin ? "Admin" : "Operador"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-xs pt-0">
                <div className="rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5 text-primary" />
                      Cuentas Autorizadas
                    </span>
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => openPermissionsModal(u.id)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Editar Permisos
                      </button>
                    )}
                  </div>

                  {isAdmin ? (
                    <span className="text-xs font-medium text-emerald-600">
                      Acceso total a todas las cuentas ({cuentas.length})
                    </span>
                  ) : assignedAccounts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {assignedAccounts.map((c) => (
                        <Badge
                          key={c.id}
                          variant="outline"
                          className="bg-background text-[10px] py-0.5"
                        >
                          {c.nombre}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Sin cuentas asignadas (0)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* CREATE USER DIALOG MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Registra un usuario y asigna su rol e itinerario de cuentas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-nombre">Nombre Completo</Label>
              <Input
                id="create-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. María Elena Burelo"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">Correo Electrónico</Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@agropina.mx"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-password">Contraseña (Mínimo 8 caracteres)</Label>
              <Input
                id="create-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-rol">Rol de Acceso</Label>
              <SelectNative
                id="create-rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as any)}
              >
                <option value="persona">Operador (Acceso restringido a sus cuentas)</option>
                <option value="admin">Administrador (Acceso total a todo)</option>
              </SelectNative>
            </div>

            {rol === "persona" && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Seleccionar Cuentas Autorizadas:
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {cuentas.map((c) => {
                    const isChecked = selectedCuentaIds.includes(c.id)
                    return (
                      <div
                        key={c.id}
                        className="flex items-center space-x-2 rounded-lg border p-2 text-xs"
                      >
                        <Checkbox
                          id={`create-cuenta-${c.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCuentaIds([...selectedCuentaIds, c.id])
                            } else {
                              setSelectedCuentaIds(selectedCuentaIds.filter((id) => id !== c.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`create-cuenta-${c.id}`}
                          className="cursor-pointer font-medium leading-none"
                        >
                          {c.nombre}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PERMISSIONS DIALOG MODAL */}
      <Dialog
        open={editingPermissionsUserId !== null}
        onOpenChange={(open) => !open && setEditingPermissionsUserId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Matriz de Permisos de Cuentas
            </DialogTitle>
            <DialogDescription>
              Asigna o revoca el acceso a las cuentas para {editingUser?.nombre}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cuentas.map((c) => {
                const isChecked = tempCuentaIds.includes(c.id)
                return (
                  <div
                    key={`perm-${c.id}`}
                    className="flex items-center justify-between rounded-xl border p-3 text-xs transition hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id={`perm-cuenta-${c.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTempCuentaIds([...tempCuentaIds, c.id])
                          } else {
                            setTempCuentaIds(tempCuentaIds.filter((id) => id !== c.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`perm-cuenta-${c.id}`}
                        className="cursor-pointer font-semibold text-foreground"
                      >
                        {c.nombre}
                      </label>
                    </div>

                    <span className="text-[10px] text-muted-foreground uppercase font-mono">
                      {c.moneda}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPermissionsUserId(null)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Permisos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
