import type { ReactNode } from "react";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { SidebarNav } from "@/presentation/components/sidebar-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<SidebarProvider>
			<SidebarNav />
			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
					<SidebarTrigger className="-ml-1" />
					<div className="h-4 w-px bg-border" />
					<span className="text-sm font-medium text-foreground">DEMO</span>
				</header>
				<div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
					{children}
				</div>
			</SidebarInset>
			<Toaster richColors position="top-right" />
		</SidebarProvider>
	);
}
