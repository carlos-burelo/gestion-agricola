import "server-only"
import type { GeoPolygon, Parcela, Rancho } from "@/core/domain/entities"
import { costingService, repository } from "@/infrastructure/container"

export interface ParcelaMapa {
  id: string
  identificador: string
  ranchoNombre: string
  estado: string
  superficieM2: number
  geometria: GeoPolygon | null
  costoTotal: number
}

export async function loadParcelasMapa(): Promise<ParcelaMapa[]> {
  const [parcelas, ranchos, costos] = await Promise.all([
    repository<Parcela>("parcelas").findAll(),
    repository<Rancho>("ranchos").findAll(),
    costingService().resumenPorNivel("parcelaId"),
  ])
  const ranchoNombre = new Map(ranchos.map((r) => [r.id, r.nombre]))
  const costoPorParcela = new Map(costos.map((c) => [c.clave, c.total]))
  return parcelas.map((p) => ({
    id: p.id,
    identificador: p.identificador,
    ranchoNombre: ranchoNombre.get(p.ranchoId) ?? "—",
    estado: p.estado,
    superficieM2: p.superficieM2,
    geometria: p.geometria ?? null,
    costoTotal: costoPorParcela.get(p.id) ?? 0,
  }))
}
