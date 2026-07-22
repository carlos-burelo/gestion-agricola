"use client"

import { useActionState, useState } from "react"
import Image from "next/image"
import { 
  ArrowRight, 
  Building2, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Landmark, 
  Leaf, 
  Loader2, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Sprout 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login } from "./actions"

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null)
  const [showPassword, setShowPassword] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [passwordInput, setPasswordInput] = useState("")

  const setDemoCredentials = (email: string, pass: string) => {
    setEmailInput(email)
    setPasswordInput(pass)
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Decorative ambient background lights */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full bg-emerald-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[500px] rounded-full bg-green-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[160px]" />

      {/* Subtle background grid lines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-emerald-900/40 bg-slate-900/80 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl lg:grid lg:grid-cols-12">
        
        {/* Left Side: Brand Showcase & Highlights */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900/60 p-8 text-white lg:col-span-5 lg:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
          
          <div>
            {/* Logo and Brand Name */}
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 p-2 shadow-lg shadow-emerald-600/30">
                <Image src="/icon.svg" alt="MGZ Logo" width={28} height={28} className="brightness-200" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">
                  MGZ
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                  S. de P.R. de R.L.
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Sprout className="size-3.5 text-emerald-400" />
                Sistema de Gestión Agrícola
              </span>
              <h1 className="text-2xl font-bold leading-tight text-balance text-white sm:text-3xl">
                Control de Producción y Finanzas
              </h1>
              <p className="text-xs leading-relaxed text-slate-300">
                Plataforma integral para administración de ranchos, piña MD2, bancos, costeo y trazabilidad.
              </p>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="my-8 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/5 p-2.5 backdrop-blur-sm transition-colors hover:bg-white/10">
              <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                <Leaf className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Cultivos MD2</span>
                <span className="text-[10px] text-slate-400">Ranchos & Parcelas</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/5 p-2.5 backdrop-blur-sm transition-colors hover:bg-white/10">
              <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                <Landmark className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Bancos</span>
                <span className="text-[10px] text-slate-400">Tesorería & Cuentas</span>
              </div>
            </div>
          </div>

          {/* Security Banner */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>Acceso restringido y cifrado para personal autorizado</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex flex-col justify-between p-8 lg:col-span-7 lg:p-10">
          <div>
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-bold text-white">Iniciar Sesión</h2>
              <p className="text-xs text-slate-400">
                Ingresa tus credenciales institucionales para acceder
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              {error && (
                <div className="animate-in fade-in slide-in-from-top-1 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-slate-300">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@mgz.mx"
                    className="border-slate-800 bg-slate-950/80 pl-10 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password text-slate-300" className="text-xs font-medium text-slate-300">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="border-slate-800 bg-slate-950/80 pl-10 pr-10 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={pending}
                className="group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-green-500 hover:shadow-emerald-600/40 active:scale-[0.99] disabled:opacity-70"
              >
                {pending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Validando acceso...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrar al Sistema
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>

            {/* Quick-fill Demo Credentials Box */}
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="size-3 text-emerald-400" />
                  Acceso Demo Rápido
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoCredentials("admin@mgz.mx", "admin123")}
                  className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-left transition-all hover:border-emerald-500/50 hover:bg-slate-900"
                >
                  <span className="text-xs font-medium text-emerald-400">Admin General</span>
                  <span className="text-[10px] text-slate-400">admin@mgz.mx</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials("cajas@mgz.mx", "operador123")}
                  className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-left transition-all hover:border-emerald-500/50 hover:bg-slate-900"
                >
                  <span className="text-xs font-medium text-emerald-400">Operador Campo</span>
                  <span className="text-[10px] text-slate-400">cajas@mgz.mx</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-[11px] text-slate-500">
            MGZ, S. de P.R. de R.L. &copy; {new Date().getFullYear()} &middot; Todos los derechos reservados.
          </div>
        </div>

      </div>
    </div>
  )
}

