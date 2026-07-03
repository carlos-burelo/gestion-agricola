"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyPassword } from "@/infrastructure/auth/password"
import { crearToken } from "@/infrastructure/auth/session"
import { repository } from "@/infrastructure/container"
import type { Usuario } from "@/core/domain/entities"

const DIA_MS = 24 * 60 * 60 * 1000

export async function login(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  const usuarios = await repository<Usuario>("usuarios").findBy({ email })
  const usuario = usuarios[0]
  if (!usuario || usuario.estado !== "activo" || !verifyPassword(password, usuario.passwordHash)) {
    return "Correo o contraseña incorrectos."
  }

  const token = crearToken({
    usuarioId: usuario.id,
    rol: usuario.rol,
    exp: Date.now() + 7 * DIA_MS,
  })
  const jar = await cookies()
  jar.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
  redirect("/dashboard/tesoreria")
}
