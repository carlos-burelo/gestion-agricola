"use client";

import {
	ArrowLeftRight,
	BarChart3,
	Boxes,
	ClipboardList,
	FileOutput,
	FileText,
	FlaskConical,
	GitBranch,
	LayoutDashboard,
	LayoutGrid,
	Leaf,
	type LucideIcon,
	LineChart,
	MapIcon,
	MapPin,
	MapPinned,
	NotebookPen,
	Package,
	PackageCheck,
	Receipt,
	Repeat2,
	ShoppingCart,
	Sprout,
	Truck,
	UserCog,
	Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
	SidebarRail,
} from "@/components/ui/sidebar";
import { MODULE_GROUPS, MODULES } from "@/presentation/config/modules";

const TOOLS: { slug: string; title: string; icon: LucideIcon }[] = [
	{ slug: "mapa", title: "Mapa de parcelas", icon: MapPinned },
	{ slug: "kardex", title: "Kardex PEPS", icon: Boxes },
	{ slug: "costeo", title: "Costeo agrícola", icon: BarChart3 },
	{ slug: "trazabilidad", title: "Trazabilidad", icon: GitBranch },
	{ slug: "reportes", title: "Reportes", icon: ClipboardList },
];

const TESORERIA_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
	{ slug: "tesoreria", title: "Cuentas", icon: Wallet },
	{ slug: "tesoreria/traspasos", title: "Traspasos", icon: Repeat2 },
	{ slug: "tesoreria/reportes/mensual", title: "Reportes", icon: LineChart },
	{ slug: "tesoreria/usuarios", title: "Usuarios", icon: UserCog },
];

/** Icon per module slug so the icon-collapsed rail stays legible. */
const SLUG_ICON: Record<string, LucideIcon> = {
	ranchos: MapPin,
	parcelas: MapIcon,
	plantillas: LayoutGrid,
	ciclos: Sprout,
	siembras: Leaf,
	semilleros: FlaskConical,
	actividades: ClipboardList,
	"registros-actividad": NotebookPen,
	productos: Package,
	proveedores: Truck,
	movimientos: ArrowLeftRight,
	requerimientos: FileText,
	cotizaciones: Receipt,
	"ordenes-compra": ShoppingCart,
	recepciones: PackageCheck,
	"cuentas-por-pagar": Wallet,
	"vales-salida": FileOutput,
};

export function SidebarNav() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
							<span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								{/* <Leaf className="size-5" /> */}
								<Image src="/icon.svg" alt="Logo" width={20} height={20} />
							</span>
							<span className="flex flex-col gap-0.5 leading-none">
								<span className="font-semibold">DEMO</span>
								<span className="text-xs text-sidebar-foreground/70">
									Gestión de producción
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
								render={<Link href="/dashboard" />}
							>
								<LayoutDashboard />
								<span>Resumen</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>

				{MODULE_GROUPS.map((group) => {
					const items = MODULES.filter((m) => m.group === group);
					return (
						<SidebarGroup key={group}>
							<SidebarGroupLabel>{group}</SidebarGroupLabel>
							<SidebarMenu>
								{items.map((m) => {
									const Icon = SLUG_ICON[m.slug] ?? Leaf;
									const href = `/dashboard/${m.slug}`;
									return (
										<SidebarMenuItem key={m.slug}>
											<SidebarMenuButton
												isActive={pathname === href}
												tooltip={m.title}
												render={<Link href={href} />}
											>
												<Icon />
												<span>{m.title}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroup>
					);
				})}

				<SidebarGroup>
					<SidebarGroupLabel>Tesorería</SidebarGroupLabel>
					<SidebarMenu>
						{TESORERIA_LINKS.map((t) => {
							const href = `/dashboard/${t.slug}`;
							return (
								<SidebarMenuItem key={t.slug}>
									<SidebarMenuButton
										isActive={pathname === href}
										tooltip={t.title}
										render={<Link href={href} />}
									>
										<t.icon />
										<span>{t.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

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
										render={<Link href={href} />}
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
							tooltip="Producción de Piña"
							className="text-sidebar-foreground/70"
						>
							<Leaf />
							<span className="text-xs">Producción de Piña · 2026</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
