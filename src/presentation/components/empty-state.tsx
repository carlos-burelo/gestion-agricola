import { Inbox } from "lucide-react"

export function EmptyState({
  message = "Sin datos para mostrar.",
}: {
  message?: string
}) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Inbox className="size-6" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
