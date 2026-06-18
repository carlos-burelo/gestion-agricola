import "server-only"
import type { BaseEntity, CollectionName } from "@/core/domain/entities"
import { repository } from "@/infrastructure/container"
import type { FieldConfig, ModuleConfig } from "./config/modules"

export interface ReferenceOption {
  value: string
  label: string
}

/** Loads { id -> label } maps for every reference field used by a module. */
export async function loadReferenceOptions(
  config: ModuleConfig,
): Promise<Record<string, ReferenceOption[]>> {
  const refFields = config.fields.filter(
    (f): f is FieldConfig & { reference: NonNullable<FieldConfig["reference"]> } =>
      f.type === "reference" && Boolean(f.reference),
  )

  const result: Record<string, ReferenceOption[]> = {}
  await Promise.all(
    refFields.map(async (field) => {
      const rows = await repository<BaseEntity>(
        field.reference.collection,
      ).findAll()
      result[field.name] = rows.map((row) => ({
        value: row.id,
        label: String(
          (row as unknown as Record<string, unknown>)[
            field.reference.labelField
          ] ?? row.id,
        ),
      }))
    }),
  )
  return result
}

/** Loads the rows for a module's collection. */
export async function loadRecords<T extends BaseEntity = BaseEntity>(
  collection: CollectionName,
): Promise<T[]> {
  return repository<T>(collection).findAll()
}

/** Builds a global { id -> label } map across all reference targets so tables
 * can render human-readable values instead of raw ids. */
export async function loadLabelMap(
  config: ModuleConfig,
): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  const options = await loadReferenceOptions(config)
  for (const opts of Object.values(options)) {
    for (const opt of opts) map[opt.value] = opt.label
  }
  return map
}
