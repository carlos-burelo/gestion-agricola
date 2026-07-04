import "server-only"
import { cookies } from "next/headers"
import { verificarToken, type SessionPayload } from "./session"

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get("session")?.value
  return token ? verificarToken(token) : null
}
