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

  if (!email || !password) {
    return "Por favor ingresa tu correo y contraseña."
  }

  let usuario: Usuario | undefined

  try {
    const usuarios = await repository<Usuario>("usuarios").findBy({ email })
    usuario = usuarios[0]
  } catch (error) {
    console.error("Error de conexión o consulta en login:", error)
    return "No se pudo conectar a la base de datos PostgreSQL. Asegúrate de iniciar el servicio con 'docker compose up -d'."
  }

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
