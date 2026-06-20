import { formatDate } from "@/lib/dates"
import type { FieldConfig } from "@/presentation/config/modules"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"

const MONEY = ["costo", "importe", "precio", "valor"]

function isMoney(name: string): boolean {
  const n = name.toLowerCase()
  return MONEY.some((k) => n.includes(k))
}

/** Plain-text value used for sorting and global search. */
export function cellText(
  field: FieldConfig,
  value: unknown,
  labelMap: Record<string, string>,
): string {
  if (value === undefined || value === null || value === "") return "—"
  if (field.type === "reference") return labelMap[String(value)] ?? String(value)
  if (field.type === "select") {
    const opt = field.options?.find((o) => o.value === String(value))
    return opt?.label ?? String(value)
  }
  if (field.name === "esSemillero")
    return value === "true" || value === true ? "Sí" : "No"
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (field.type === "number") {
    const n = Number(value)
    return isMoney(field.name)
      ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
      : n.toLocaleString("es-MX")
  }
  if (field.type === "date") return formatDate(String(value))
  return String(value)
}

/** Rich cell rendering: badges, chips, tabular money, emphasized primary. */
export function CellContent({
  field,
  value,
  labelMap,
  emphasize,
}: {
  field: FieldConfig
  value: unknown
  labelMap: Record<string, string>
  emphasize?: boolean
}) {
  const text = cellText(field, value, labelMap)
  if (text === "—") return <span className="text-muted-foreground">—</span>
  if (field.type === "select" || field.name === "esSemillero")
    return <StatusBadge estado={text} tone={String(value)} />
  if (field.type === "reference")
    return (
      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {text}
      </span>
    )
  if (field.type === "number")
    return <span className="tabular-nums">{text}</span>
  return (
    <span className={cn(emphasize && "font-medium text-foreground")}>{text}</span>
  )
}
