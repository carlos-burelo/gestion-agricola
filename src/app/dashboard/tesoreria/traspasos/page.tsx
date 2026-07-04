import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { toDateInput } from "@/lib/dates"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { Cuenta } from "@/core/domain/entities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { registrarTraspaso } from "./actions"

export const dynamic = "force-dynamic"

export default async function TraspasosPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  if (actor.rol !== "admin") redirect("/dashboard/tesoreria")

  const cuentas = await repository<Cuenta>("cuentas").findAll()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Traspasos" description="Mover dinero entre dos cuentas en un solo paso." badge="Tesorería" />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Nuevo traspaso</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={registrarTraspaso}>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="fecha">Fecha</FieldLabel>
                <Input id="fecha" name="fecha" type="date" defaultValue={toDateInput()} required />
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="cuentaOrigenId">Cuenta origen</FieldLabel>
                <Select name="cuentaOrigenId">
                  <SelectTrigger id="cuentaOrigenId" className="w-full">
                    <SelectValue placeholder="Cuenta origen…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {cuentas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="cuentaDestinoId">Cuenta destino</FieldLabel>
                <Select name="cuentaDestinoId">
                  <SelectTrigger id="cuentaDestinoId" className="w-full">
                    <SelectValue placeholder="Cuenta destino…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {cuentas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="responsive">
                <FieldLabel htmlFor="monto">Monto</FieldLabel>
                <Input id="monto" name="monto" type="number" step="0.01" min="0.01" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="referencia">Referencia</FieldLabel>
                <Input id="referencia" name="referencia" />
              </Field>
              <Field>
                <Button type="submit">Registrar traspaso</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
