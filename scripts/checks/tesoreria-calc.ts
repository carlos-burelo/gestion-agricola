import assert from "node:assert/strict"
import { calcularSaldo } from "@/core/application/tesoreria-calc"

// Saldo inicial + una entrada + una salida.
const saldo1 = calcularSaldo(1000, [
  { direccion: "entrada", monto: 500 },
  { direccion: "salida", monto: 200 },
])
assert.equal(saldo1, 1300, "1000 + 500 - 200 = 1300")

// Sin movimientos, el saldo es el inicial.
assert.equal(calcularSaldo(250, []), 250)

// Solo salidas puede dar negativo (no se trunca en 0 — refleja sobregiro real).
assert.equal(calcularSaldo(100, [{ direccion: "salida", monto: 300 }]), -200)

console.log("OK tesoreria-calc: calcularSaldo")
