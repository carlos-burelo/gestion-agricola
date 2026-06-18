export function PageHeader({
  title,
  description,
  badge,
}: {
  title: string
  description?: string
  badge?: string
}) {
  return (
    <header className="mb-6 flex flex-col gap-1">
      {badge && (
        <span className="text-xs font-medium uppercase tracking-wide text-primary">
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
    </header>
  )
}
