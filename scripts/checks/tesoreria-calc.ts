import assert from "node:assert/strict"
import { calcularSaldo, calcularMatrizMensual } from "@/core/application/tesoreria-calc"

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

const categorias = [
  {
    id: "cat-produccion",
    nombre: "PRODUCCION",
    tipo: "egreso" as const,
    parentId: "",
    orden: 1,
    estado: "activo" as const,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "cat-fertilizantes",
    nombre: "FERTILIZANTES Y AGROQUIMICOS",
    tipo: "egreso" as const,
    parentId: "cat-produccion",
    orden: 2,
    estado: "activo" as const,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "cat-cortes",
    nombre: "CORTES Y FLETES",
    tipo: "egreso" as const,
    parentId: "cat-produccion",
    orden: 3,
    estado: "activo" as const,
    createdAt: "",
    updatedAt: "",
  },
]

const movimientos = [
  {
    id: "m1",
    cuentaId: "cta-mgz121",
    fecha: "2025-01-15T00:00:00.000Z",
    direccion: "salida" as const,
    categoriaId: "cat-fertilizantes",
    monto: 1000,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "",
    traspasoId: "",
    creadoPor: "",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "m2",
    cuentaId: "cta-mgz121",
    fecha: "2025-01-20T00:00:00.000Z",
    direccion: "salida" as const,
    categoriaId: "cat-cortes",
    monto: 300,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "",
    traspasoId: "",
    creadoPor: "",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "m3",
    cuentaId: "cta-mgz121",
    fecha: "2025-02-01T00:00:00.000Z",
    direccion: "salida" as const,
    categoriaId: "cat-fertilizantes",
    monto: 9999,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "",
    traspasoId: "",
    creadoPor: "",
    createdAt: "",
    updatedAt: "",
  },
]

const matriz = calcularMatrizMensual(categorias, movimientos, 1, 2025)
const fertilizantes = matriz.filas.find((f) => f.categoriaId === "cat-fertilizantes")!
const produccion = matriz.filas.find((f) => f.categoriaId === "cat-produccion")!
assert.equal(fertilizantes.porCuenta["cta-mgz121"], 1000, "solo enero, no febrero")
assert.equal(produccion.total, 1300, "PRODUCCION = suma de sus dos hijas (1000+300)")
assert.equal(matriz.totalGeneral, 1300)

console.log("OK tesoreria-calc: calcularMatrizMensual")
