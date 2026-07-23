"use client"

import type { ReactNode } from "react"
import type { RolUsuario } from "@/core/domain/entities"
import { canRoleAccess } from "@/infrastructure/auth/permissions"

export interface CanAccessProps {
  userRole?: RolUsuario
  slug?: string
  allowedRoles?: RolUsuario[]
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Reusable wrapper to conditionally render UI components based on user role and permissions.
 *
 * Usage:
 * <CanAccess userRole={user.rol} slug="bancos">
 *    <Button>Crear Transferencia</Button>
 * </CanAccess>
 *
 * Or by explicitly allowed roles:
 * <CanAccess userRole={user.rol} allowedRoles={["admin", "administrativo"]}>
 *    <AdminPanel />
 * </CanAccess>
 */
export function CanAccess({
  userRole,
  slug,
  allowedRoles,
  children,
  fallback = null,
}: CanAccessProps) {
  if (!userRole) return <>{fallback}</>

  if (userRole === "admin") return <>{children}</>

  if (allowedRoles && allowedRoles.length > 0) {
    if (allowedRoles.includes(userRole)) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  if (slug && !canRoleAccess(userRole, slug)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
