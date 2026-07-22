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
    const value = raw[field.name]
    if (value === undefined) continue
    switch (field.type) {
      case "number":
        data[field.name] = value === "" ? 0 : Number(value)
        break
      case "json":
        data[field.name] = value ? JSON.parse(value) : []
        break
      case "select":
        if (field.name === "esSemillero") data[field.name] = value === "true"
        else data[field.name] = value
        break
      default:
        data[field.name] = value
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
  if (error instanceof DomainError) return error.message
  if (error instanceof SyntaxError) return "JSON inválido en un campo."
  if (error instanceof Error) return error.message
  return "Error desconocido."
}
