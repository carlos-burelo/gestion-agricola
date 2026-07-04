import { createHmac, timingSafeEqual } from "node:crypto"
import type { RolUsuario } from "@/core/domain/entities"

export interface SessionPayload {
  usuarioId: string
  rol: RolUsuario
  /** epoch ms */
  exp: number
}

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error("SESSION_SECRET no está configurado.")
  return s
}

function firmar(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url")
}

export function crearToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${data}.${firmar(data)}`
}

export function verificarToken(token: string): SessionPayload | null {
  const [data, firma] = token.split(".")
  if (!data || !firma) return null
  const esperada = firmar(data)
  const a = Buffer.from(firma)
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString())
  } catch {
    return null
  }
  if (payload.exp < Date.now()) return null
  return payload
}
