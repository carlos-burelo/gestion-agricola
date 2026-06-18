"use server"

import { revalidatePath } from "next/cache"
import type { GeoPolygon, Parcela } from "@/core/domain/entities"
import { DomainError } from "@/core/domain/errors"
import { crudService } from "@/infrastructure/container"

export async function saveParcelaGeometria(
  parcelaId: string,
  geometria: GeoPolygon | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await crudService<Parcela>("parcelas").update(parcelaId, { geometria })
    revalidatePath("/dashboard/mapa")
    return { ok: true }
  } catch (error) {
    const msg =
      error instanceof DomainError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Error desconocido."
    return { ok: false, error: msg }
  }
}
