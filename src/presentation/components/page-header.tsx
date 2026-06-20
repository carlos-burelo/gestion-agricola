import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
	title,
	description,
	badge,
	icon,
	accentClassName,
}: {
	title: string;
	description?: string;
	badge?: string;
	/** Optional leading visual (e.g. a coloured module icon tile). */
	icon?: ReactNode;
	/** Accent classes for the badge (defaults to the primary colour). */
	accentClassName?: string;
}) {
	return (
		<header className="flex items-start gap-4">
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
		</header>
	);
}
