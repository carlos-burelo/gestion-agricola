"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { crearTraspaso } from "@/infrastructure/container"
import { BusinessRuleError } from "@/core/domain/errors"

export async function registrarTraspaso(formData: FormData) {
  const actor = await getCurrentUser()
  if (!actor) throw new BusinessRuleError("Sesión inválida.")

  await crearTraspaso({
    fecha: String(formData.get("fecha")),
    cuentaOrigenId: String(formData.get("cuentaOrigenId")),
    cuentaDestinoId: String(formData.get("cuentaDestinoId")),
    monto: Number(formData.get("monto")),
    referencia: String(formData.get("referencia") ?? ""),
    creadoPor: actor.usuarioId,
  })

  revalidatePath("/dashboard/tesoreria")
}
