import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
	title,
	description,
	badge,
	icon,
	accentClassName,
	children,
}: {
	title: string;
	description?: string;
	badge?: string;
	/** Optional leading visual (e.g. a coloured module icon tile). */
	icon?: ReactNode;
	/** Accent classes for the badge (defaults to the primary colour). */
	accentClassName?: string;
	children?: ReactNode;
}) {
	return (
		<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div className="flex items-start gap-4">
				{icon}
				<div className="flex flex-col gap-1">
					{badge && (
						<span
							className={cn(
								"text-xs font-medium uppercase tracking-wide",
								accentClassName ?? "text-primary",
							)}
						>
							{badge}
						</span>
					)}
					<h1 className="text-2xl font-semibold text-balance text-foreground">
						{title}
					</h1>
					{description && (
						<p className="text-sm leading-relaxed text-muted-foreground text-pretty">
							{description}
						</p>
					)}
				</div>
			</div>
			{children && <div className="flex items-center gap-2">{children}</div>}
		</header>
	);
}
