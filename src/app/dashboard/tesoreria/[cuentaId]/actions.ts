"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { BusinessRuleError } from "@/core/domain/errors"
import type { Movimiento, UsuarioCuenta } from "@/core/domain/entities"

export async function capturarMovimiento(cuentaId: string, formData: FormData) {
  const actor = await getCurrentUser()
  if (!actor) throw new BusinessRuleError("Sesión inválida.")

  if (actor.rol === "persona") {
    const asignadas = await repository<UsuarioCuenta>("usuarioCuentas").findBy({ usuarioId: actor.usuarioId })
    if (!asignadas.some((a) => a.cuentaId === cuentaId)) {
      throw new BusinessRuleError("No tienes permiso sobre esta cuenta.")
    }
  }

  await repository<Movimiento>("movimientos").create({
    cuentaId,
    fecha: String(formData.get("fecha")),
    direccion: String(formData.get("direccion")) as "entrada" | "salida",
    categoriaId: String(formData.get("categoriaId") ?? ""),
    monto: Number(formData.get("monto")),
    beneficiario: String(formData.get("beneficiario") ?? ""),
    referencia: String(formData.get("referencia") ?? ""),
    folio: String(formData.get("folio") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    traspasoId: "",
    creadoPor: actor.usuarioId,
  })

  revalidatePath(`/dashboard/tesoreria/${cuentaId}`)
  revalidatePath("/dashboard/tesoreria")
}
