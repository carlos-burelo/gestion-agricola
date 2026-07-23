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
  Landmark,
  Layers,
  LayoutDashboard,
  Leaf,
  type LucideIcon,
  MapPinned,
  Package,
  Percent,
  Receipt,
  ShoppingBag,
  Sprout,
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
import type { RolUsuario } from "@/core/domain/entities";
import { canRoleAccess } from "@/infrastructure/auth/permissions";

/** Concentrated Catalog Modules List for Collapsible Menu */
const CATALOGOS_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
  { slug: "ranchos", title: "Ranchos", icon: MapPinned },
  { slug: "parcelas", title: "Parcelas MD2", icon: Leaf },
  { slug: "plantillas", title: "Plantillas Siembras", icon: Layers },
  { slug: "ciclos", title: "Ciclos Agrícolas", icon: Sprout },
  { slug: "siembras", title: "Siembras", icon: Sprout },
  { slug: "semilleros", title: "Semilleros", icon: Leaf },
  { slug: "trabajadores", title: "Trabajadores (Nómina)", icon: Users },
  { slug: "actividades", title: "Actividades Campo", icon: ClipboardList },
  { slug: "productos", title: "Productos e Insumos", icon: Package },
  { slug: "proveedores", title: "Proveedores", icon: Building2 },
  { slug: "clientes", title: "Clientes", icon: UserCheck },
  { slug: "familiares", title: "Socios & Familiares", icon: Users },
  { slug: "cat-gastos-operativos", title: "Gastos Operativos", icon: Receipt },
  { slug: "cat-gastos-financieros", title: "Gastos Financieros", icon: Percent },
  { slug: "cat-gastos-administrativos", title: "Gastos Admvos", icon: FileText },
  { slug: "cat-gastos-familia", title: "Gastos Familiares", icon: Users },
];

/** Operational Modules Links */
const BANCOS_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
  { slug: "bancos", title: "Cuentas Bancarias", icon: Wallet },
  { slug: "bancos/estados-de-cuenta", title: "Estados de Cuenta", icon: FileText },
  { slug: "bancos/transferencias", title: "Transferencias SPEI", icon: ArrowLeftRight },
];

const OPERACIONES_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
  { slug: "clientes/ventas-pina", title: "Ventas de Piña", icon: Leaf },
  { slug: "clientes/abonos", title: "Abonos de Clientes", icon: HandCoins },
  { slug: "gastos-externos", title: "Otros Gastos", icon: Receipt },
  { slug: "vales-salida", title: "Vales de Salida", icon: Receipt },
  { slug: "ordenes-compra", title: "Órdenes de Compra", icon: ShoppingBag },
  { slug: "kardex", title: "Kardex PEPS", icon: Boxes },
];

const TOOLS_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
  { slug: "mapa", title: "Mapa de parcelas", icon: MapPinned },
  { slug: "costeo", title: "Costeo agrícola", icon: BarChart3 },
  { slug: "trazabilidad", title: "Trazabilidad", icon: GitBranch },
  { slug: "reportes", title: "Reportes Globales", icon: ClipboardList },
];

const SISTEMA_LINKS: { slug: string; title: string; icon: LucideIcon }[] = [
  { slug: "usuarios", title: "Usuarios y Permisos", icon: UserCog },
];

export function SidebarNav({ userRole }: { userRole?: RolUsuario }) {
  const pathname = usePathname();

  // Filter links dynamically based on user role permissions
  const catalogosLinks = CATALOGOS_LINKS.filter((c) => canRoleAccess(userRole, c.slug));
  const bancosLinks = BANCOS_LINKS.filter((b) => canRoleAccess(userRole, b.slug));
  const operacionesLinks = OPERACIONES_LINKS.filter((o) => canRoleAccess(userRole, o.slug));
  const toolsLinks = TOOLS_LINKS.filter((t) => canRoleAccess(userRole, t.slug));
  const sistemaLinks = SISTEMA_LINKS.filter((s) => canRoleAccess(userRole, s.slug));

  const isCatalogActive =
    pathname.startsWith("/dashboard/catalogos") ||
    catalogosLinks.some((c) => pathname === `/dashboard/${c.slug}`);

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
        {/* Resumen Dashboard */}
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
          </SidebarMenu>
        </SidebarGroup>

        {/* Collapsible Catálogos Section */}
        {catalogosLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Catálogos</SidebarGroupLabel>
            <SidebarMenu>
              <Collapsible
                defaultOpen={isCatalogActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isCatalogActive}
                      tooltip="Catálogos del Sistema"
                    >
                      <BookOpen className="size-4" />
                      <span>Catálogos ({catalogosLinks.length})</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {catalogosLinks.map((c) => {
                        const href = `/dashboard/${c.slug}`;
                        const isActive = pathname === href;
                        return (
                          <SidebarMenuSubItem key={c.slug}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <a href={href} className="flex items-center gap-2">
                                <c.icon className="size-3.5 shrink-0 text-muted-foreground" />
                                <span>{c.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Bancos y Tesorería */}
        {bancosLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Bancos y Tesorería</SidebarGroupLabel>
            <SidebarMenu>
              {bancosLinks.map((b) => {
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
        )}

        {/* Operaciones y Ventas */}
        {operacionesLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Operaciones</SidebarGroupLabel>
            <SidebarMenu>
              {operacionesLinks.map((o) => {
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
        )}

        {/* Análisis y Herramientas */}
        {toolsLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Análisis</SidebarGroupLabel>
            <SidebarMenu>
              {toolsLinks.map((t) => {
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
        )}

        {/* Sistema */}
        {sistemaLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarMenu>
              {sistemaLinks.map((s) => {
                const href = `/dashboard/${s.slug}`;
                return (
                  <SidebarMenuItem key={s.slug}>
                    <SidebarMenuButton
                      isActive={pathname === href}
                      tooltip={s.title}
                      href={href}
                    >
                      <s.icon />
                      <span>{s.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
