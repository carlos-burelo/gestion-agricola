"use server"

import { revalidatePath } from "next/cache"
import { DomainError } from "@/core/domain/errors"
import { crudService } from "@/infrastructure/container"
import { getCurrentUser } from "@/infrastructure/auth/current-user"

export interface CrearAnticipoClienteInput {
  clienteId: string
  bancoCuentaId: string
  monto: number
  fecha: string
  fechaDeposito: string
  formaPago: string
  bancoEmisor?: string
  noTransferenciaCheque?: string
  observaciones?: string
}

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function crearAnticipoClienteAction(
  input: CrearAnticipoClienteInput
): Promise<ActionResult> {
  try {
    const actor = await getCurrentUser()

    if (!input.clienteId) {
      throw new DomainError("Debes seleccionar el cliente.")
    }
    if (!input.bancoCuentaId) {
      throw new DomainError("Debes seleccionar la cuenta destino.")
    }
    if (!input.monto || input.monto <= 0) {
      throw new DomainError("El monto del anticipo debe ser mayor a $0.00.")
    }

    const folio = input.noTransferenciaCheque
      ? `SPEI-${input.noTransferenciaCheque}`
      : `ANT-${Date.now().toString().slice(-6)}`

    // 1. Registrar el anticipo en la colección anticiposClientes
    await crudService("anticiposClientes").create({
      clienteId: input.clienteId,
      bancoCuentaId: input.bancoCuentaId,
      monto: input.monto,
      fecha: input.fecha,
      formaPago: input.formaPago || "Transferencia SPEI",
      folio,
      estado: "pendiente",
    } as never)

    // 2. Registrar la entrada de dinero en la cuenta destino (movimientos)
    const bancoInfo = input.bancoEmisor ? ` (${input.bancoEmisor})` : ""
    await crudService("movimientos").create({
      cuentaId: input.bancoCuentaId,
      fecha: input.fechaDeposito || input.fecha,
      direccion: "entrada",
      categoriaId: null,
      monto: input.monto,
      beneficiario: "Cliente (Anticipo Piña)",
      referencia: folio,
      folio,
      descripcion: `Anticipo Venta Piña${bancoInfo} - ${input.observaciones || "Anticipo de cliente"}`,
      traspasoId: null,
      creadoPor: actor?.usuarioId ?? "Sistema",
    } as never)

    revalidatePath("/dashboard/clientes")
    revalidatePath("/dashboard/clientes/anticipos")
    revalidatePath("/dashboard/bancos")
    revalidatePath("/dashboard/tesoreria")
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al registrar el anticipo del cliente."
    return { ok: false, error: msg }
  }
}
