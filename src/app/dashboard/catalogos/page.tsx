import { CatalogosHub, type CatalogModuleData } from "@/presentation/components/catalogos-hub"
import { MODULES } from "@/presentation/config/modules"
import {
  loadLabelMap,
  loadRecords,
  loadReferenceOptions,
} from "@/presentation/queries"
import { repository } from "@/infrastructure/container"
import type { Cuenta, UsuarioCuenta } from "@/core/domain/entities"

export const dynamic = "force-dynamic"

export default async function CatalogosPage() {
  const [modulesData, usuarioCuentas, cuentas] = await Promise.all([
    Promise.all(
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
    ),
    repository<UsuarioCuenta>("usuarioCuentas").findAll(),
    repository<Cuenta>("cuentas").findAll(),
  ])

  const cuentasPorUsuarioMap: Record<string, string[]> = {}
  for (const uc of usuarioCuentas) {
    if (!cuentasPorUsuarioMap[uc.usuarioId]) {
      cuentasPorUsuarioMap[uc.usuarioId] = []
    }
    cuentasPorUsuarioMap[uc.usuarioId].push(uc.cuentaId)
  }

  return (
    <CatalogosHub
      modulesData={modulesData}
      cuentasPorUsuarioMap={cuentasPorUsuarioMap}
      cuentasList={cuentas as unknown as Record<string, unknown>[]}
    />
  )
}
