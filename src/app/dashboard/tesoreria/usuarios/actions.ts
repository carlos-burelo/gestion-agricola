"use server"

import { revalidatePath } from "next/cache"
import { hashPassword } from "@/infrastructure/auth/password"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { BusinessRuleError } from "@/core/domain/errors"
import type { RolUsuario, Usuario, UsuarioCuenta } from "@/core/domain/entities"

export async function crearUsuario(formData: FormData) {
  const actor = await getCurrentUser()
  if (!actor || actor.rol !== "admin") {
    throw new BusinessRuleError("Solo un administrador puede crear usuarios.")
  }

  const nombre = String(formData.get("nombre") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const rol = String(formData.get("rol") ?? "persona") as RolUsuario
  const cuentaIds = formData.getAll("cuentaIds").map(String)

  if (!nombre || !email || password.length < 8) {
    throw new BusinessRuleError(
      "Nombre, correo y contraseña (mínimo 8 caracteres) son obligatorios.",
    )
  }

  const usuario = await repository<Usuario>("usuarios").create({
    nombre,
    email,
    passwordHash: hashPassword(password),
    rol,
    estado: "activo",
  })

  if (rol === "persona") {
    for (const cuentaId of cuentaIds) {
      await repository<UsuarioCuenta>("usuarioCuentas").create({
        usuarioId: usuario.id,
        cuentaId,
      })
    }
  }

  revalidatePath("/dashboard/tesoreria/usuarios")
}
