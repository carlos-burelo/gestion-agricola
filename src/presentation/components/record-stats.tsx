import { Coins, Hash, ListChecks, Users } from "lucide-react"
import type { ReactNode } from "react"
import type { ModuleConfig } from "@/presentation/config/modules"
import { StatCard } from "./stat-card"

const MONEY = ["costo", "importe", "precio", "valor"]
const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)
const iconCls = "size-4 text-primary"

export function RecordStats({
  config,
  records,
}: {
  config: ModuleConfig
  records: Record<string, unknown>[]
}) {
  const cards: { label: string; value: string; icon: ReactNode }[] = [
    {
      label: `Total ${config.title.toLowerCase()}`,
      value: records.length.toLocaleString("es-MX"),
      icon: <ListChecks className={iconCls} />,
    },
  ]

  const moneyField = config.fields.find(
    (f) =>
      f.type === "number" && MONEY.some((k) => f.name.toLowerCase().includes(k)),
  )
  if (moneyField) {
    const sum = records.reduce(
      (a, r) => a + (Number(r[moneyField.name]) || 0),
      0,
    )
    cards.push({
      label: `${moneyField.label} total`,
      value: currency(sum),
      icon: <Coins className={iconCls} />,
    })
  }

  const estadoField = config.fields.find(
    (f) => f.type === "select" && f.name === "estado",
  )
  if (estadoField?.options?.length) {
    const first = estadoField.options[0]
    const n = records.filter(
      (r) => String(r[estadoField.name]) === first.value,
    ).length
    cards.push({
      label: first.label,
      value: n.toLocaleString("es-MX"),
      icon: <Hash className={iconCls} />,
    })
  }

  const refField = config.fields.find((f) => f.type === "reference")
  if (refField) {
    const distinct = new Set(
      records
        .map((r) => String(r[refField.name]))
        .filter((v) => v && v !== "undefined"),
    )
    cards.push({
      label: `${refField.label} distintos`,
      value: distinct.size.toLocaleString("es-MX"),
      icon: <Users className={iconCls} />,
    })
  }

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.slice(0, 4).map((c) => (
        <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />
      ))}
    </section>
  )
}
