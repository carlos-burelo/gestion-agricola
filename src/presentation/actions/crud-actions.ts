"use server"

import { revalidatePath } from "next/cache"
import type { BaseEntity } from "@/core/domain/entities"
import { BusinessRuleError, DomainError } from "@/core/domain/errors"
import { crudService } from "@/infrastructure/container"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { getModuleBySlug } from "@/presentation/config/modules"

export interface ActionResult {
  ok: boolean
  error?: string
}

const SLUGS_ADMIN_ONLY = new Set(["cuentas", "categorias"])

async function verificaPermisoModulo(slug: string): Promise<void> {
  if (!SLUGS_ADMIN_ONLY.has(slug)) return
  const actor = await getCurrentUser()
  if (!actor || actor.rol !== "admin") {
    throw new BusinessRuleError(
      "Solo un administrador puede modificar cuentas o categorías.",
    )
  }
}

/**
 * Coerces the flat string map coming from an HTML form into the typed shape
 * each field expects, based on the module's field metadata.
 */
function coerce(slug: string, raw: Record<string, string>) {
  const config = getModuleBySlug(slug)
  if (!config) throw new DomainError(`Módulo desconocido: ${slug}`)
  const data: Record<string, unknown> = {}

  for (const field of config.fields) {
    const rawVal = raw[field.name]
    const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : ""

    if (field.required) {
      if (!valStr || valStr === "__none") {
        throw new BusinessRuleError(`El campo "${field.label}" es obligatorio.`)
      }
    }

    switch (field.type) {
      case "number":
        if (!valStr) {
          data[field.name] = field.required ? 0 : null
        } else {
          const num = Number(valStr)
          if (isNaN(num)) {
            throw new BusinessRuleError(`El campo "${field.label}" debe ser un número válido.`)
          }
          data[field.name] = num
        }
        break
      case "json":
        if (!valStr) data[field.name] = []
        else data[field.name] = JSON.parse(valStr)
        break
      case "select":
        if (field.name === "esSemillero") {
          data[field.name] = valStr === "true"
        } else {
          data[field.name] = valStr || (field.required ? "" : null)
        }
        break
      case "reference":
        if (!valStr || valStr === "__none") {
          if (field.required) {
            throw new BusinessRuleError(`Selecciona un ${field.label} válido.`)
          }
          data[field.name] = null
        } else {
          data[field.name] = valStr
        }
        break
      default:
        if (!valStr) {
          data[field.name] = field.required ? "" : null
        } else {
          data[field.name] = valStr
        }
    }
  }
  return { config, data }
}

export async function createRecord(
  slug: string,
  raw: Record<string, string>,
): Promise<ActionResult> {
  try {
    await verificaPermisoModulo(slug)
    const { config, data } = coerce(slug, raw)
    await crudService<BaseEntity>(config.collection).create(data as never)
    revalidatePath(`/dashboard/${slug}`)
    revalidatePath("/dashboard/catalogos")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: toMessage(error) }
  }
}

export async function updateRecord(
  slug: string,
  id: string,
  raw: Record<string, string>,
): Promise<ActionResult> {
  try {
    await verificaPermisoModulo(slug)
    const { config, data } = coerce(slug, raw)
    await crudService<BaseEntity>(config.collection).update(id, data as never)
    revalidatePath(`/dashboard/${slug}`)
    revalidatePath("/dashboard/catalogos")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: toMessage(error) }
  }
}

export async function deleteRecord(
  slug: string,
  id: string,
): Promise<ActionResult> {
  try {
    await verificaPermisoModulo(slug)
    const config = getModuleBySlug(slug)
    if (!config) throw new DomainError(`Módulo desconocido: ${slug}`)
    await crudService<BaseEntity>(config.collection).remove(id)
    revalidatePath(`/dashboard/${slug}`)
    revalidatePath("/dashboard/catalogos")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: toMessage(error) }
  }
}

function toMessage(error: unknown): string {
  if (error instanceof DomainError || error instanceof BusinessRuleError) {
    return error.message
  }
  if (error instanceof SyntaxError) return "JSON inválido en un campo."
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("foreign key") || msg.includes("violates foreign key")) {
      return "No se pudo realizar la operación: El registro de referencia seleccionado no existe o fue eliminado."
    }
    if (msg.includes("not-null") || msg.includes("null value in column")) {
      return "Por favor completa todos los campos requeridos."
    }
    if (msg.includes("unique") || msg.includes("duplicate key")) {
      return "Ya existe un registro con este nombre o identificador."
    }
    return error.message
  }
  return "Error desconocido al procesar la solicitud."
}
