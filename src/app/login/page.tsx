"use client"

import { useActionState, useState } from "react"
import Image from "next/image"
import {
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sprout,
  Wallet,
} from "lucide-react"
import type { RolUsuario } from "@/core/domain/entities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { login } from "./actions"

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null)
  const [showPassword, setShowPassword] = useState(false)
  const [emailInput, setEmailInput] = useState("admin@mgz.mx")
  const [passwordInput, setPasswordInput] = useState("admin123")
  const [selectedRole, setSelectedRole] = useState<RolUsuario>("admin")

  const handleRoleSelect = (role: RolUsuario) => {
    setSelectedRole(role)
    switch (role) {
      case "admin":
        setEmailInput("admin@mgz.mx")
        setPasswordInput("admin123")
        break
      case "administrativo":
        setEmailInput("adminis@mgz.mx")
        setPasswordInput("adminis123")
        break
      case "operativo":
      case "persona":
        setEmailInput("operador@mgz.mx")
        setPasswordInput("operador123")
        break
      case "inventario":
        setEmailInput("inventario@mgz.mx")
        setPasswordInput("inventario123")
        break
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md border-border bg-card shadow-sm">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted p-3">
            <Image
              src="/icon.svg"
              alt="MGZ Logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              MGZ, S. de P.R. de R.L.
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Sistema de Gestión Agrícola & Tesorería
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Role selector for demo testing */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Seleccionar Perfil Demo
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect("admin")}
                className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all ${
                  selectedRole === "admin"
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Admin</span>
                </div>
                {selectedRole === "admin" && <Check className="size-3.5 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("administrativo")}
                className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all ${
                  selectedRole === "administrativo"
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-primary" />
                  <span>Administrativo</span>
                </div>
                {selectedRole === "administrativo" && <Check className="size-3.5 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("operativo")}
                className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all ${
                  selectedRole === "operativo" || selectedRole === "persona"
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sprout className="size-4 text-primary" />
                  <span>Operativo</span>
                </div>
                {(selectedRole === "operativo" || selectedRole === "persona") && (
                  <Check className="size-3.5 text-primary" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("inventario")}
                className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all ${
                  selectedRole === "inventario"
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  <span>Inventario</span>
                </div>
                {selectedRole === "inventario" && <Check className="size-3.5 text-primary" />}
              </button>
            </div>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ej. usuario@mgz.mx"
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="w-full font-semibold gap-2"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center text-[11px] text-muted-foreground">
            MGZ, S. de P.R. de R.L. &copy; {new Date().getFullYear()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
