import type { ReactNode } from "react";
import { LogOut, User } from "lucide-react";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarNav } from "@/presentation/components/sidebar-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/infrastructure/auth/current-user";
import { logout } from "@/app/login/actions";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
	const actor = await getCurrentUser();

	return (
		<SidebarProvider>
			<TooltipProvider>
				<SidebarNav userRole={actor?.rol} />
				<SidebarInset>
					<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
						<div className="flex items-center gap-2">
							<SidebarTrigger className="-ml-1" />
							<div className="h-4 w-px bg-border" />
							<span className="text-sm font-bold text-foreground tracking-tight">
								MGZ, S. de P.R. de R.L.
							</span>
							<Badge variant="outline" className="hidden sm:inline-flex border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
								Sistema Agrícola
							</Badge>
						</div>

						<div className="flex items-center gap-3">
							{actor && (
								<div className="hidden md:flex items-center gap-2 text-xs">
									<div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
										<User className="size-3.5" />
									</div>
									<div className="flex flex-col">
										<span className="font-semibold text-foreground leading-none">
											{actor.rol === "admin" ? "Administrador" : "Usuario Campo"}
										</span>
										<span className="text-[10px] text-muted-foreground leading-none mt-0.5">
											{actor.rol}
										</span>
									</div>
								</div>
							)}

							<form action={logout}>
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									className="gap-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
								>
									<LogOut className="size-4" />
									<span className="hidden sm:inline">Cerrar Sesión</span>
								</Button>
							</form>
						</div>
					</header>
					<div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
						{children}
					</div>
				</SidebarInset>
			</TooltipProvider>
			<Toaster richColors position="top-right" />
		</SidebarProvider>
	);
}
