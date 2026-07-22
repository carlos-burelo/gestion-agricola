import {
  ArrowLeftRight,
  BadgeDollarSign,
  BadgePercent,
  Building2,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  FolderCog,
  HandCoins,
  Handshake,
  HeartHandshake,
  Landmark,
  LandPlot,
  LayoutGrid,
  Leaf,
  Link2,
  type LucideIcon,
  NotebookPen,
  PackageCheck,
  PackageMinus,
  Percent,
  Receipt,
  RefreshCw,
  Repeat,
  ShoppingCart,
  Sprout,
  Tags,
  Tractor,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import type { CollectionName } from "@/core/domain/entities"
import type { ModuleConfig } from "./modules"

interface GroupTheme {
  tile: string
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
  "Clientes y Ventas": {
    tile: "bg-teal-500/10 text-teal-600",
    badge: "text-teal-600",
  },
  "Banco y Préstamos": {
    tile: "bg-blue-500/10 text-blue-600",
    badge: "text-blue-600",
  },
  "Catálogos de Gastos": {
    tile: "bg-rose-500/10 text-rose-600",
    badge: "text-rose-600",
  },
  "Otros Gastos": {
    tile: "bg-indigo-500/10 text-indigo-600",
    badge: "text-indigo-600",
  },
  "Compras e inventario": {
    tile: "bg-sky-500/10 text-sky-600",
    badge: "text-sky-600",
  },
  Tesorería: {
    tile: "bg-emerald-600/10 text-emerald-700",
    badge: "text-emerald-700",
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
  trabajadores: Users,
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
  catGastosOperativos: FolderCog,
  catGastosFinancieros: Percent,
  catGastosAdministrativos: Tags,
  catGastosFamilia: HeartHandshake,
  familiares: Users,
  clientes: UserCheck,
  ventasPina: DollarSign,
  ventasGanado: BadgeDollarSign,
  anticiposClientes: HandCoins,
  abonosClientes: Receipt,
  prestamosBancarios: Landmark,
  prestamosExternos: Handshake,
  abonosPrestamos: BadgePercent,
  transferenciasHijuelos: ArrowLeftRight,
  cargosComisiones: CreditCard,
  gastosExternos: Receipt,
  categorias: Tags,
  cuentas: Wallet,
  usuarios: Users,
  usuarioCuentas: Link2,
  traspasos: Repeat,
  movimientos: Receipt,
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
