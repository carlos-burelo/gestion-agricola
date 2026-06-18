import { notFound } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { RecordStats } from "@/presentation/components/record-stats"
import { RecordTable } from "@/presentation/components/record-table"
import { getModuleBySlug, MODULES } from "@/presentation/config/modules"
import {
  loadLabelMap,
  loadRecords,
  loadReferenceOptions,
} from "@/presentation/queries"

// Slugs handled by dedicated pages (not generic CRUD).
const RESERVED = new Set([
  "kardex",
  "costeo",
  "trazabilidad",
  "reportes",
  "mapa",
])

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }))
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (RESERVED.has(slug)) notFound()

  const config = getModuleBySlug(slug)
  if (!config) notFound()

  const [records, referenceOptions, labelMap] = await Promise.all([
    loadRecords(config.collection),
    loadReferenceOptions(config),
    loadLabelMap(config),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        badge={config.group}
        title={config.title}
        description={config.description}
      />
      <RecordStats
        config={config}
        records={records as unknown as Record<string, unknown>[]}
      />
      <RecordTable
        config={config}
        records={records as unknown as Record<string, unknown>[]}
        referenceOptions={referenceOptions}
        labelMap={labelMap}
      />
    </div>
  )
}
