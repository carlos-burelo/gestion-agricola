import "server-only"
import type { Movimiento, Traspaso } from "@/core/domain/entities"
import { BusinessRuleError } from "@/core/domain/errors"
import { db } from "./client"
import { movimientos, traspasos } from "./schema"
import { DrizzleRepository } from "./repository"
import { generateId, nowDate } from "./util"

export interface CrearTraspasoInput {
  fecha: string
  cuentaOrigenId: string
  cuentaDestinoId: string
  monto: number
  referencia?: string
  creadoPor?: string
}

export interface TraspasoCreado {
  traspaso: Traspaso
  movimientoOrigen: Movimiento
  movimientoDestino: Movimiento
}

export async function crearTraspaso(
  input: CrearTraspasoInput,
): Promise<TraspasoCreado> {
  if (input.cuentaOrigenId === input.cuentaDestinoId) {
    throw new BusinessRuleError(
      "La cuenta de origen y destino no pueden ser la misma.",
    )
  }
  if (!(input.monto > 0)) {
    throw new BusinessRuleError("El monto del traspaso debe ser mayor a 0.")
  }

  const now = nowDate()
  const fecha = new Date(input.fecha)
  const traspasoId = generateId("traspasos")
  const movimientoOrigenId = generateId("movimientos")
  const movimientoDestinoId = generateId("movimientos")
  const referencia = input.referencia ?? null
  const creadoPor = input.creadoPor ?? null

  await db.transaction(async (tx) => {
    await tx.insert(traspasos).values({
      id: traspasoId,
      fecha,
      cuentaOrigenId: input.cuentaOrigenId,
      cuentaDestinoId: input.cuentaDestinoId,
      monto: input.monto,
      referencia,
      creadoPor,
      createdAt: now,
      updatedAt: now,
    })
    await tx.insert(movimientos).values([
      {
        id: movimientoOrigenId,
        cuentaId: input.cuentaOrigenId,
        fecha,
        direccion: "salida",
        categoriaId: null,
        monto: input.monto,
        beneficiario: null,
        referencia,
        folio: null,
        descripcion: "Traspaso de salida",
        traspasoId,
        creadoPor,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: movimientoDestinoId,
        cuentaId: input.cuentaDestinoId,
        fecha,
        direccion: "entrada",
        categoriaId: null,
        monto: input.monto,
        beneficiario: null,
        referencia,
        folio: null,
        descripcion: "Traspaso de entrada",
        traspasoId,
        creadoPor,
        createdAt: now,
        updatedAt: now,
      },
    ])
  })

  const traspasoRepo = new DrizzleRepository<Traspaso>("traspasos")
  const movimientoRepo = new DrizzleRepository<Movimiento>("movimientos")
  const [traspaso, movimientoOrigen, movimientoDestino] = await Promise.all([
    traspasoRepo.findById(traspasoId),
    movimientoRepo.findById(movimientoOrigenId),
    movimientoRepo.findById(movimientoDestinoId),
  ])
  return {
    traspaso: traspaso!,
    movimientoOrigen: movimientoOrigen!,
    movimientoDestino: movimientoDestino!,
  }
}
