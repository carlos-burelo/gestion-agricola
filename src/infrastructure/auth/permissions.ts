import type { RolUsuario } from "@/core/domain/entities"

export interface RoleDefinition {
  rol: RolUsuario
  label: string
  description: string
  badgeColor: string
  allowedSlugs: string[]
}

/**
 * Central Matrix of Roles & Permissions for MGZ, S. de P.R. de R.L.
 */
export const ROLES_CONFIG: Record<RolUsuario, RoleDefinition> = {
  admin: {
    rol: "admin",
    label: "Administrador General",
    description: "Acceso total e ilimitado a todos los módulos, tesorería, catálogos, reportes y usuarios.",
    badgeColor: "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    allowedSlugs: ["*"],
  },
  administrativo: {
    rol: "administrativo",
    label: "Administrativo & Finanzas",
    description: "Acceso a Tesorería, Bancos, Clientes, Proveedores, Ventas, Abonos, Otros Gastos y Reportes.",
    badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    allowedSlugs: [
      "bancos",
      "bancos/estados-de-cuenta",
      "bancos/transferencias",
      "bancos/prestamos-bancarios",
      "bancos/prestamos-externos",
      "bancos/cargos-comisiones",
      "clientes",
      "clientes/anticipos",
      "clientes/ventas-pina",
      "clientes/abonos",
      "proveedores",
      "familiares",
      "gastos-externos",
      "cat-gastos-operativos",
      "cat-gastos-financieros",
      "cat-gastos-administrativos",
      "cat-gastos-familia",
      "tesoreria",
      "tesoreria/traspasos",
      "tesoreria/reportes/mensual",
      "reportes",
      "catalogos",
    ],
  },
  operativo: {
    rol: "operativo",
    label: "Operativo de Campo",
    description: "Acceso a Estructura Agrícola, Ranchos, Parcelas, Plantillas, Ciclos, Siembras, Semilleros, Trabajadores y Trazabilidad.",
    badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    allowedSlugs: [
      "ranchos",
      "parcelas",
      "plantillas",
      "ciclos",
      "siembras",
      "semilleros",
      "trabajadores",
      "actividades",
      "mapa",
      "trazabilidad",
      "costeo",
    ],
  },
  inventario: {
    rol: "inventario",
    label: "Gestión de Inventario",
    description: "Acceso a Productos, Movimientos de Almacén, Vales de Salida, Órdenes de Compra y Kardex PEPS.",
    badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    allowedSlugs: [
      "productos",
      "almacen",
      "vales-salida",
      "compras",
      "requerimientos",
      "cotizaciones",
      "ordenes-compra",
      "recepciones",
      "cuentas-por-pagar",
      "kardex",
      "reportes",
    ],
  },
  persona: {
    rol: "persona",
    label: "Operador (Legacy)",
    description: "Permisos heredados de operador de campo.",
    badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    allowedSlugs: [
      "ranchos",
      "parcelas",
      "plantillas",
      "ciclos",
      "siembras",
      "semilleros",
      "trabajadores",
      "actividades",
      "mapa",
      "trazabilidad",
      "costeo",
    ],
  },
}

/** Check if a given user role is authorized to access a specific route/slug */
export function canRoleAccess(rol?: RolUsuario, slug?: string): boolean {
  if (!rol) return false
  if (rol === "admin") return true
  if (!slug) return true

  const config = ROLES_CONFIG[rol] ?? ROLES_CONFIG.operativo
  if (config.allowedSlugs.includes("*")) return true

  // Clean slug
  const clean = slug.replace(/^\//, "").replace(/\/$/, "")

  return config.allowedSlugs.some((s) => clean === s || clean.startsWith(`${s}/`))
}

/** Returns the RoleDefinition for UI labels and badges */
export function getRoleDefinition(rol: RolUsuario): RoleDefinition {
  return ROLES_CONFIG[rol] ?? ROLES_CONFIG.operativo
}

/** List of active system roles for dropdown selectors */
export const SYSTEM_ROLES: { value: RolUsuario; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Admin General",
    description: "Acceso total e ilimitado a todos los módulos y usuarios.",
  },
  {
    value: "administrativo",
    label: "Administrativo",
    description: "Tesorería, Bancos, Clientes, Ventas, Abonos y Reportes.",
  },
  {
    value: "operativo",
    label: "Operativo",
    description: "Ranchos, Parcelas, Siembras, Semilleros, Trabajadores y Mapa.",
  },
  {
    value: "inventario",
    label: "Inventario",
    description: "Productos, Compras, Almacén, Vales y Kardex PEPS.",
  },
]
