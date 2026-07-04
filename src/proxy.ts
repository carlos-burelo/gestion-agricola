import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verificarToken } from "@/infrastructure/auth/session"

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }
  const token = request.cookies.get("session")?.value
  const payload = token ? verificarToken(token) : null
  if (!payload) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
