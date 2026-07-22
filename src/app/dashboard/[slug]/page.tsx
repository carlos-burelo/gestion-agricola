import { notFound } from "next/navigation"
import { CatalogosHub, type CatalogModuleData } from "@/presentation/components/catalogos-hub"
import { getModuleBySlug, MODULES } from "@/presentation/config/modules"
import {
  loadLabelMap,
  loadRecords,
  loadReferenceOptions,
} from "@/presentation/queries"

export const dynamic = "force-dynamic"

// Slugs handled by dedicated pages (not generic CRUD).
const RESERVED = new Set([
  "kardex",
  "costeo",
  "trazabilidad",
  "reportes",
  "mapa",
  "tesoreria",
  "bancos",
  "clientes",
])

export function generateStaticParams() {
  return [
    { slug: "catalogos" },
    ...MODULES.map((m) => ({ slug: m.slug })),
  ]
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (RESERVED.has(slug)) notFound()

  if (slug !== "catalogos" && !getModuleBySlug(slug)) {
    notFound()
  }

  const modulesData: CatalogModuleData[] = await Promise.all(
    MODULES.map(async (config) => {
      const [records, referenceOptions, labelMap] = await Promise.all([
        loadRecords(config.collection),
        loadReferenceOptions(config),
        loadLabelMap(config),
      ])
      return {
        slug: config.slug,
        config,
        records: records as unknown as Record<string, unknown>[],
        referenceOptions,
        labelMap,
      }
    })
  )

  return <CatalogosHub modulesData={modulesData} initialSlug={slug} />
}
