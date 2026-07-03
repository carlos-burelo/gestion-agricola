import "dotenv/config"
import assert from "node:assert/strict"
import { hashPassword, verifyPassword } from "@/infrastructure/auth/password"
import { crearToken, verificarToken } from "@/infrastructure/auth/session"

const hash = hashPassword("correcto-caballo-batería")
assert.ok(hash.includes(":"), "formato salt:derivado")
assert.ok(verifyPassword("correcto-caballo-batería", hash), "password correcto debe verificar")
assert.ok(!verifyPassword("incorrecto", hash), "password incorrecto no debe verificar")

const token = crearToken({ usuarioId: "u1", rol: "admin", exp: Date.now() + 60_000 })
const payload = verificarToken(token)
assert.equal(payload?.usuarioId, "u1")
assert.equal(payload?.rol, "admin")

// Token alterado no debe verificar.
const alterado = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A")
assert.equal(verificarToken(alterado), null, "firma alterada debe rechazarse")

// Token expirado no debe verificar.
const expirado = crearToken({ usuarioId: "u1", rol: "admin", exp: Date.now() - 1 })
assert.equal(verificarToken(expirado), null, "token expirado debe rechazarse")

console.log("OK auth: password + session")
