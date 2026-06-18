import type {
  RegistroActividad,
  Semillero,
  ValeSalida,
} from "@/core/domain/entities"
import type { Repository } from "@/core/domain/repositories"

export type NivelCosteo = "ranchoId" | "parcelaId" | "plantillaId" | "cicloId"

export interface ResumenCosto {
  clave: string
  manoObra: number
  insumos: number
  total: number
}

export interface CostoSemilla {
  semilleroId: string
  costoTotal: number
  plantasProducidas: number
  costoUnitario: number
}

/**
 * Agricultural costing use-cases: accumulates labor + input costs at any of the
 * four costing levels (rancho, parcela, plantilla, ciclo) and derives the unit
 * cost of nursery-produced plants.
 */
export class CostingService {
  constructor(
    private readonly registros: Repository<RegistroActividad>,
    private readonly vales: Repository<ValeSalida>,
    private readonly semilleros: Repository<Semillero>,
  ) {}

  /** Accumulates labor (registros) and inputs (vales) grouped by a level key. */
  async resumenPorNivel(nivel: NivelCosteo): Promise<ResumenCosto[]> {
    const [registros, vales] = await Promise.all([
      this.registros.findAll(),
      this.vales.findAll(),
    ])

    const map = new Map<string, ResumenCosto>()
    const bucket = (clave: string): ResumenCosto => {
      let entry = map.get(clave)
      if (!entry) {
        entry = { clave, manoObra: 0, insumos: 0, total: 0 }
        map.set(clave, entry)
      }
      return entry
    }

    for (const r of registros) {
      const entry = bucket(r[nivel])
      entry.manoObra += r.costo
      entry.total += r.costo
    }

    for (const v of vales) {
      const importe = v.detalles.reduce(
        (acc, d) => acc + d.cantidad * d.costoUnitario,
        0,
      )
      const entry = bucket(v[nivel])
      entry.insumos += importe
      entry.total += importe
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }

  /** Computes the unit cost of plants produced in each nursery. */
  async costoSemilla(): Promise<CostoSemilla[]> {
    const semilleros = await this.semilleros.findAll()
    return semilleros.map((s) => {
      const costoTotal = s.costoManoObra + s.costoInsumos + s.costoMaquinaria
      return {
        semilleroId: s.id,
        costoTotal,
        plantasProducidas: s.plantasProducidas,
        costoUnitario: s.plantasProducidas
          ? costoTotal / s.plantasProducidas
          : 0,
      }
    })
  }
}
