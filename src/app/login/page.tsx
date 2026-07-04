"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { login } from "./actions"

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="email">Correo</FieldLabel>
                <Input id="email" name="email" type="email" required aria-invalid={!!error} />
              </Field>
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input id="password" name="password" type="password" required aria-invalid={!!error} />
                {error && <FieldError>{error}</FieldError>}
              </Field>
              <Field>
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Entrando…" : "Entrar"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
