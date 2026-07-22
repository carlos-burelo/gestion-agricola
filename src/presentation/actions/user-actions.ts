"use server"

import { revalidatePath } from "next/cache"
import { hashPassword } from "@/infrastructure/auth/password"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { RolUsuario, Usuario, UsuarioCuenta } from "@/core/domain/entities"

export interface CrearUsuarioInput {
  nombre: string
  email: string
  password: string
  rol: RolUsuario
  cuentaIds: string[]
}

export async function crearUsuarioAction(input: CrearUsuarioInput) {
  const actor = await getCurrentUser()
  if (!actor || actor.rol !== "admin") {
    return { ok: false, error: "Solo un administrador puede crear usuarios." }
  }

  const nombre = input.nombre.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const rol = input.rol
  const cuentaIds = input.cuentaIds

  if (!nombre || !email || password.length < 8) {
    return {
      ok: false,
      error: "Nombre, correo y contraseña (mínimo 8 caracteres) son obligatorios.",
    }
  }

  try {
    const existing = await repository<Usuario>("usuarios").findBy({ email })
    if (existing.length > 0) {
      return { ok: false, error: "Ya existe un usuario registrado con este correo." }
    }

    const usuario = await repository<Usuario>("usuarios").create({
      nombre,
      email,
      passwordHash: hashPassword(password),
      rol,
      estado: "activo",
    })

    if (rol === "persona" && cuentaIds.length > 0) {
      for (const cuentaId of cuentaIds) {
        await repository<UsuarioCuenta>("usuarioCuentas").create({
          usuarioId: usuario.id,
          cuentaId,
        })
      }
    }

    revalidatePath("/dashboard/catalogos")
    revalidatePath("/dashboard/tesoreria")
    return { ok: true }
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "Error al crear usuario" }
  }
}

export async function actualizarPermisosCuentasAction(
  usuarioId: string,
  cuentaIds: string[]
) {
  const actor = await getCurrentUser()
  if (!actor || actor.rol !== "admin") {
    return { ok: false, error: "Solo un administrador puede modificar permisos." }
  }

  try {
    // Delete existing account permissions for this user
    const existing = await repository<UsuarioCuenta>("usuarioCuentas").findBy({ usuarioId })
    for (const uc of existing) {
      await repository<UsuarioCuenta>("usuarioCuentas").delete(uc.id)
    }

    // Insert new account permissions
    for (const cuentaId of cuentaIds) {
      await repository<UsuarioCuenta>("usuarioCuentas").create({
        usuarioId,
        cuentaId,
      })
    }

    revalidatePath("/dashboard/catalogos")
    revalidatePath("/dashboard/tesoreria")
    return { ok: true }
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "Error al actualizar permisos" }
  }
}
