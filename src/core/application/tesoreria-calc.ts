import type { DireccionMovimiento } from "@/core/domain/entities"

/**
 * saldo = saldoInicial + Σ(entradas) - Σ(salidas). No se trunca en 0: un
 * saldo negativo es información real (sobregiro), no un error de cálculo.
 */
export function calcularSaldo(
  saldoInicial: number,
  movimientos: { direccion: DireccionMovimiento; monto: number }[],
): number {
  return movimientos.reduce(
    (saldo, m) => saldo + (m.direccion === "entrada" ? m.monto : -m.monto),
    saldoInicial,
  )
}
