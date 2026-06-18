import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TONE: Record<string, string> = {
  activo: "border-transparent bg-primary/15 text-primary",
  inactivo: "border-transparent bg-muted text-muted-foreground",
  planeado: "border-transparent bg-chart-3/15 text-chart-3",
  cosechado: "border-transparent bg-accent/20 text-accent-foreground",
  cerrado: "border-transparent bg-muted text-muted-foreground",
  pendiente: "border-transparent bg-accent/20 text-accent-foreground",
  pagada: "border-transparent bg-primary/15 text-primary",
  vencida: "border-transparent bg-destructive/15 text-destructive",
  borrador: "border-transparent bg-muted text-muted-foreground",
  autorizada: "border-transparent bg-chart-3/15 text-chart-3",
  parcial: "border-transparent bg-accent/20 text-accent-foreground",
  surtida: "border-transparent bg-primary/15 text-primary",
  cancelada: "border-transparent bg-destructive/15 text-destructive",
  cotizada: "border-transparent bg-chart-3/15 text-chart-3",
  comprada: "border-transparent bg-primary/15 text-primary",
  entrada: "border-transparent bg-primary/15 text-primary",
  salida: "border-transparent bg-accent/20 text-accent-foreground",
  true: "border-transparent bg-primary/15 text-primary",
  false: "border-transparent bg-muted text-muted-foreground",
}

export function StatusBadge({
  estado,
  tone,
}: {
  estado: string
  tone?: string
}) {
  const key = (tone ?? estado).toLowerCase()
  return (
    <Badge variant="outline" className={cn("capitalize", TONE[key])}>
      {estado}
    </Badge>
  )
}
