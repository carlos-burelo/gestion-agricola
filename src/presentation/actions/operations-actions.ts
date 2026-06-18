"use server"

import { revalidatePath } from "next/cache"
import type { KardexRow } from "@/core/application/inventory-service"
import { DomainError } from "@/core/domain/errors"
import {
  costingService,
  inventoryService,
  traceabilityService,
} from "@/infrastructure/container"

export interface ActionResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

export async function getKardexAction(
  productoId: string,
): Promise<ActionResult<KardexRow[]>> {
  if (!productoId) return { ok: true, data: [] }
  const rows = await inventoryService().kardex(productoId)
  return { ok: true, data: rows }
}

export async function registrarSalidaAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await inventoryService().registrarSalida({
      productoId: String(formData.get("productoId") ?? ""),
      cantidad: Number(formData.get("cantidad") ?? 0),
      fecha: String(formData.get("fecha") ?? new Date().toISOString().slice(0, 10)),
      destino: String(formData.get("destino") ?? ""),
    })
    revalidatePath("/dashboard/kardex")
    revalidatePath("/dashboard/movimientos-inventario")
    return { ok: true }
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, error: error.message }
    return { ok: false, error: "Error al registrar la salida" }
  }
}

export async function trazarAction(
  requerimientoId: string,
): Promise<ActionResult> {
  if (!requerimientoId) return { ok: true, data: [] }
  const steps = await traceabilityService().trazar(requerimientoId)
  return { ok: true, data: steps }
}

export async function resumenCostoAction(
  nivel: "ranchoId" | "parcelaId" | "plantillaId" | "cicloId",
) {
  return costingService().resumenPorNivel(nivel)
}
