"use client";

import {
	ArrowLeftRight,
	BarChart3,
	BookOpen,
	Boxes,
	Building2,
	ChevronRight,
	ClipboardList,
	FileText,
	GitBranch,
	HandCoins,
	Handshake,
	Landmark,
	LayoutDashboard,
	Leaf,
	LineChart,
	type LucideIcon,
	MapPinned,
	Percent,
	Receipt,
	UserCheck,
	UserCog,
	Users,
	Wallet,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
} from "@/components/ui/sidebar";

const BANCOS_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
	{ slug: "bancos", title: "Cuentas Bancarias", icon: Wallet },
	{
		slug: "bancos/estados-de-cuenta",
		title: "Estados de Cuenta",
		icon: FileText,
	},
	{
		slug: "bancos/transferencias",
		title: "Transferencias Bancarias",
		icon: ArrowLeftRight,
	},
	{
		slug: "bancos/prestamos-bancarios",
		title: "(e) Préstamos Bancarios",
		icon: Landmark,
	},
	{
		slug: "bancos/prestamos-externos",
		title: "(e) Préstamo de Externos",
		icon: Handshake,
	},
	{
		slug: "bancos/cargos-comisiones",
		title: "(s) Cargos y Comisiones",
		icon: Percent,
	},
];

const CLIENTES_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
	{ slug: "clientes", title: "Catálogo de Clientes", icon: UserCheck },
	{ slug: "clientes/anticipos", title: "Anticipos Venta Piña", icon: Receipt },
	{ slug: "clientes/ventas-pina", title: "Ventas de Piña", icon: Leaf },
	{ slug: "clientes/abonos", title: "Abonos de Clientes", icon: HandCoins },
];

const OPERACIONES_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
	{ slug: "proveedores", title: "Proveedores", icon: Building2 },
	{ slug: "gastos-externos", title: "Otros Gastos", icon: Receipt },
	{ slug: "trabajadores", title: "Nóminas (Mano de Obra)", icon: Users },
];

const TOOLS: { slug: string; title: string; icon: LucideIcon }[] = [
	{ slug: "mapa", title: "Mapa de parcelas", icon: MapPinned },
	{ slug: "kardex", title: "Kardex PEPS", icon: Boxes },
	{ slug: "costeo", title: "Costeo agrícola", icon: BarChart3 },
	{ slug: "trazabilidad", title: "Trazabilidad", icon: GitBranch },
	{ slug: "reportes", title: "Reportes", icon: ClipboardList },
];

const SISTEMA_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
	{ slug: "usuarios", title: "Usuarios y Permisos", icon: UserCog },
];

export function SidebarNav() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" href="/dashboard">
							<span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<Image src="/icon.svg" alt="Logo" width={20} height={20} />
							</span>
							<span className="flex flex-col gap-0.5 leading-none">
								<span className="font-semibold">MGZ, S. de P.R. de R.L.</span>
								<span className="text-xs text-sidebar-foreground/70">
									Sistema de Gestión Agrícola
								</span>
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								isActive={pathname === "/dashboard"}
								tooltip="Resumen"
								href="/dashboard"
							>
								<LayoutDashboard />
								<span>Resumen</span>
							</SidebarMenuButton>
						</SidebarMenuItem>

						{/* Clean Catálogos Link without subitems */}
						<SidebarMenuItem>
							<SidebarMenuButton
								isActive={pathname.startsWith("/dashboard/catalogos")}
								tooltip="Catálogos"
								href="/dashboard/catalogos"
							>
								<BookOpen />
								<span>Catálogos</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>

				{/* Dedicated Bancos Module */}
				<SidebarGroup>
					<SidebarGroupLabel>Bancos</SidebarGroupLabel>
					<SidebarMenu>
						{BANCOS_LINKS.map((b) => {
							const href = `/dashboard/${b.slug}`;
							const isActive =
								pathname === href ||
								(b.slug === "bancos" && pathname === "/dashboard/bancos");
							return (
								<SidebarMenuItem key={b.slug}>
									<SidebarMenuButton
										isActive={isActive}
										tooltip={b.title}
										href={href}
									>
										<b.icon />
										<span>{b.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

				{/* Dedicated Clientes Module */}
				<SidebarGroup>
					<SidebarGroupLabel>Clientes y Ventas</SidebarGroupLabel>
					<SidebarMenu>
						{CLIENTES_LINKS.map((c) => {
							const href = `/dashboard/${c.slug}`;
							const isActive =
								pathname === href ||
								(c.slug === "clientes" && pathname === "/dashboard/clientes");
							return (
								<SidebarMenuItem key={c.slug}>
									<SidebarMenuButton
										isActive={isActive}
										tooltip={c.title}
										href={href}
									>
										<c.icon />
										<span>{c.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

				{/* Otras Operaciones */}
				<SidebarGroup>
					<SidebarGroupLabel>Operaciones</SidebarGroupLabel>
					<SidebarMenu>
						{OPERACIONES_LINKS.map((o) => {
							const href = `/dashboard/${o.slug}`;
							return (
								<SidebarMenuItem key={o.slug}>
									<SidebarMenuButton
										isActive={pathname === href}
										tooltip={o.title}
										href={href}
									>
										<o.icon />
										<span>{o.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

				{/* Análisis */}
				<SidebarGroup>
					<SidebarGroupLabel>Análisis</SidebarGroupLabel>
					<SidebarMenu>
						{TOOLS.map((t) => {
							const href = `/dashboard/${t.slug}`;
							return (
								<SidebarMenuItem key={t.slug}>
									<SidebarMenuButton
										isActive={pathname === href}
										tooltip={t.title}
										href={href}
									>
										<t.icon />
										<span>{t.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

				{/* Sistema */}
				<SidebarGroup>
					<SidebarGroupLabel>Sistema</SidebarGroupLabel>
					<SidebarMenu>
						{SISTEMA_LINKS.map((t) => {
							const href = `/dashboard/${t.slug}`;
							return (
								<SidebarMenuItem key={t.slug}>
									<SidebarMenuButton
										isActive={pathname === href}
										tooltip={t.title}
										href={href}
									>
										<t.icon />
										<span>{t.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip="MGZ, S. de P.R. de R.L."
							className="text-sidebar-foreground/70"
						>
							<Leaf />
							<span className="text-xs">MGZ, S. de P.R. de R.L. · 2026</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
