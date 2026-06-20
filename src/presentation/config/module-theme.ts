import {
  ArrowLeftRight,
  Building2,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  LandPlot,
  LayoutGrid,
  Leaf,
  type LucideIcon,
  NotebookPen,
  PackageCheck,
  PackageMinus,
  RefreshCw,
  ShoppingCart,
  Sprout,
  Tractor,
} from "lucide-react"
import type { CollectionName } from "@/core/domain/entities"
import type { ModuleConfig } from "./modules"

/**
 * Per-module visual identity: a distinct icon per collection plus an accent
 * colour derived from the module's group. Keeps the generic CRUD pages
 * recognizable at a glance instead of looking identical.
 */

interface GroupTheme {
  /** Icon-tile classes (background + foreground). */
  tile: string
  /** Accent classes for the group badge. */
  badge: string
}

const GROUPS: Record<string, GroupTheme> = {
  "Estructura productiva": {
    tile: "bg-emerald-500/10 text-emerald-600",
    badge: "text-emerald-600",
  },
  Producción: {
    tile: "bg-amber-500/10 text-amber-600",
    badge: "text-amber-600",
  },
  "Mano de obra": {
    tile: "bg-violet-500/10 text-violet-600",
    badge: "text-violet-600",
  },
  "Compras e inventario": {
    tile: "bg-sky-500/10 text-sky-600",
    badge: "text-sky-600",
  },
}

const FALLBACK_GROUP: GroupTheme = {
  tile: "bg-primary/10 text-primary",
  badge: "text-primary",
}

const ICONS: Record<CollectionName, LucideIcon> = {
  ranchos: Tractor,
  parcelas: LandPlot,
  plantillas: LayoutGrid,
  ciclos: RefreshCw,
  siembras: Sprout,
  semilleros: Leaf,
  actividades: ClipboardList,
  registrosActividad: NotebookPen,
  productos: FlaskConical,
  proveedores: Building2,
  movimientosInventario: ArrowLeftRight,
  requerimientos: FileText,
  cotizaciones: FileSpreadsheet,
  ordenesCompra: ShoppingCart,
  recepciones: PackageCheck,
  cuentasPorPagar: CreditCard,
  valesSalida: PackageMinus,
}

export interface ModuleTheme {
  Icon: LucideIcon
  tile: string
  badge: string
}

export function getModuleTheme(config: ModuleConfig): ModuleTheme {
  const group = GROUPS[config.group] ?? FALLBACK_GROUP
  return {
    Icon: ICONS[config.collection] ?? LayoutGrid,
    tile: group.tile,
    badge: group.badge,
  }
}
