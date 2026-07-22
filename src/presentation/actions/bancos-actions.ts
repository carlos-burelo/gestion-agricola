"use server"

import { revalidatePath } from "next/cache"
import { DomainError } from "@/core/domain/errors"
import { crudService, crearTraspaso } from "@/infrastructure/container"
import { getCurrentUser } from "@/infrastructure/auth/current-user"

export interface CrearTransferenciaInput {
  cuentaOrigenId: string
  cuentaDestinoId: string
  esCompraHijuelos: boolean
  fecha: string
  monto: number
  metodoPago: string
  folio: string
  observaciones: string
}

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function crearTransferenciaBancariaAction(
  input: CrearTransferenciaInput
): Promise<ActionResult> {
  try {
    const actor = await getCurrentUser()

    if (!input.cuentaOrigenId || !input.cuentaDestinoId) {
      throw new DomainError("Debes seleccionar la Cuenta Origen y la Cuenta Destino.")
    }
    if (input.cuentaOrigenId === input.cuentaDestinoId) {
      throw new DomainError("La Cuenta Origen y la Cuenta Destino no pueden ser la misma.")
    }
    if (!input.monto || input.monto <= 0) {
      throw new DomainError("El importe de la transferencia debe ser mayor a $0.00.")
    }

    const referencia = input.folio ? `${input.metodoPago} - ${input.folio}` : input.metodoPago

    // 1. Crear el traspaso y movimientos bancarios
    await crearTraspaso({
      fecha: input.fecha,
      cuentaOrigenId: input.cuentaOrigenId,
      cuentaDestinoId: input.cuentaDestinoId,
      monto: input.monto,
      referencia,
      creadoPor: actor?.usuarioId ?? "Sistema",
    })

    // 2. Si se marcó 'Compra de Hijuelos', registrar también en el catálogo de transferencias fisclo-financieras
    if (input.esCompraHijuelos) {
      await crudService("transferenciasHijuelos").create({
        cuentaOrigenId: input.cuentaOrigenId,
        cuentaDestinoId: input.cuentaDestinoId,
        monto: input.monto,
        fecha: input.fecha,
        folioFiscal: input.folio || "FAC-HIJ-AUTO",
        conceptoFiscal: "Compra de Hijuelos de piña en densidad de siembra",
        observaciones: input.observaciones || "Transferencia inter-cuentas por compra de hijuelos.",
      } as never)
    }

    revalidatePath("/dashboard/bancos")
    revalidatePath("/dashboard/bancos/transferencias")
    revalidatePath("/dashboard/tesoreria")
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido al procesar la transferencia."
    return { ok: false, error: msg }
  }
}

export interface CrearCargoComisionInput {
  bancoCuentaId: string
  catGastoFinancieroId: string
  monto: number
  folio: string
  fecha: string
  observaciones: string
}

export async function crearCargoComisionBancariaAction(
  input: CrearCargoComisionInput
): Promise<ActionResult> {
  try {
    const actor = await getCurrentUser()

    if (!input.bancoCuentaId) {
      throw new DomainError("Debes seleccionar la cuenta bancaria.")
    }
    if (!input.catGastoFinancieroId) {
      throw new DomainError("Debes seleccionar el concepto de gasto financiero.")
    }
    if (!input.monto || input.monto <= 0) {
      throw new DomainError("El monto del cargo o comisión debe ser mayor a $0.00.")
    }

    // 1. Guardar el registro en la colección cargosComisiones
    await crudService("cargosComisiones").create({
      bancoCuentaId: input.bancoCuentaId,
      catGastoFinancieroId: input.catGastoFinancieroId,
      monto: input.monto,
      folio: input.folio || "S/F",
      fecha: input.fecha,
      observaciones: input.observaciones || "Cargo / comisión bancaria grabada.",
    } as never)

    // 2. Registrar el movimiento de salida (Egreso) en movimientos
    await crudService("movimientos").create({
      cuentaId: input.bancoCuentaId,
      fecha: input.fecha,
      direccion: "salida",
      categoriaId: null,
      monto: input.monto,
      beneficiario: "Banco",
      referencia: input.folio || "Cargo bancario",
      folio: input.folio,
      descripcion: "Cargo / Comisión bancaria (Financiero)",
      traspasoId: null,
      creadoPor: actor?.usuarioId ?? "Sistema",
    } as never)

    revalidatePath("/dashboard/bancos")
    revalidatePath("/dashboard/bancos/cargos-comisiones")
    revalidatePath("/dashboard/tesoreria")
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al grabar el cargo o comisión bancaria."
    return { ok: false, error: msg }
  }
}
