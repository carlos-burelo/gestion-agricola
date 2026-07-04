import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { Cuenta, Usuario, UsuarioCuenta } from "@/core/domain/entities"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
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
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Cuentas asignadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nombre}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.rol === "admin" ? "default" : "secondary"}>{u.rol}</Badge>
                </TableCell>
                <TableCell>
                  {u.rol === "admin" ? "Todas" : (cuentasPorUsuario.get(u.id) ?? []).join(", ") || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Nuevo usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={crearUsuario}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                <Input id="nombre" name="nombre" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Correo</FieldLabel>
                <Input id="email" name="email" type="email" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input id="password" name="password" type="password" required minLength={8} />
              </Field>
              <Field>
                <FieldLabel htmlFor="rol">Rol</FieldLabel>
                <Select name="rol" defaultValue="persona">
                  <SelectTrigger id="rol" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="persona">Persona (solo sus cuentas)</SelectItem>
                      <SelectItem value="admin">Admin (todas las cuentas)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <FieldSet>
                <FieldLegend variant="label">Cuentas (solo aplica a rol persona)</FieldLegend>
                <FieldGroup data-slot="checkbox-group">
                  {cuentas.map((c) => (
                    <Field key={c.id} orientation="horizontal">
                      <Checkbox id={`cuenta-${c.id}`} name="cuentaIds" value={c.id} />
                      <FieldLabel htmlFor={`cuenta-${c.id}`} className="font-normal">
                        {c.nombre}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>
              <Field>
                <Button type="submit">Crear usuario</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
