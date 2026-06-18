import type {
  RegistroActividad,
  Semillero,
  Siembra,
  ValeSalida,
} from "@/core/domain/entities"
import type { Repository } from "@/core/domain/repositories"

export interface PuntoMensual {
  mes: string
  manoObra: number
  insumos: number
  total: number
}

export interface PuntoSiembra {
  mes: string
  plantas: number
}

export interface MezclaCosto {
  categoria: string
  valor: number
}

/** Returns the "YYYY-MM" month key for an ISO date string. */
function mesDe(fecha: string): string {
  return (fecha ?? "").slice(0, 7) || "0000-00"
}

/**
 * Read-only presentation analytics: temporal aggregations over existing data.
 * No domain rules live here — only grouping/summing for charts.
 */
export class AnalyticsService {
  constructor(
    private readonly registros: Repository<RegistroActividad>,
    private readonly vales: Repository<ValeSalida>,
    private readonly siembras: Repository<Siembra>,
    private readonly semilleros: Repository<Semillero>,
  ) {}

  /** Monthly labor (registros) vs inputs (vales) cost series. */
  async costosPorMes(): Promise<PuntoMensual[]> {
    const [registros, vales] = await Promise.all([
      this.registros.findAll(),
      this.vales.findAll(),
    ])
    const map = new Map<string, PuntoMensual>()
    const bucket = (mes: string): PuntoMensual => {
      let e = map.get(mes)
      if (!e) {
        e = { mes, manoObra: 0, insumos: 0, total: 0 }
        map.set(mes, e)
      }
      return e
    }
    for (const r of registros) {
      const e = bucket(mesDe(r.fecha))
      e.manoObra += r.costo
      e.total += r.costo
    }
    for (const v of vales) {
      const importe = v.detalles.reduce(
        (acc, d) => acc + d.cantidad * d.costoUnitario,
        0,
      )
      const e = bucket(mesDe(v.fecha))
      e.insumos += importe
      e.total += importe
    }
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes))
  }

  /** Monthly planted-plants series. */
  async plantasPorMes(): Promise<PuntoSiembra[]> {
    const siembras = await this.siembras.findAll()
    const map = new Map<string, PuntoSiembra>()
    for (const s of siembras) {
      const mes = mesDe(s.fecha)
      const e = map.get(mes) ?? { mes, plantas: 0 }
      e.plantas += s.cantidadPlantas
      map.set(mes, e)
    }
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes))
  }

  /** Global cost mix: labor vs inputs vs machinery. */
  async mezclaCostos(): Promise<MezclaCosto[]> {
    const [registros, vales, semilleros] = await Promise.all([
      this.registros.findAll(),
      this.vales.findAll(),
      this.semilleros.findAll(),
    ])
    const manoObra = registros.reduce((acc, r) => acc + r.costo, 0)
    const insumos = vales.reduce(
      (acc, v) =>
        acc + v.detalles.reduce((a, d) => a + d.cantidad * d.costoUnitario, 0),
      0,
    )
    const maquinaria = semilleros.reduce((acc, s) => acc + s.costoMaquinaria, 0)
    return [
      { categoria: "Mano de obra", valor: manoObra },
      { categoria: "Insumos", valor: insumos },
      { categoria: "Maquinaria", valor: maquinaria },
    ].filter((m) => m.valor > 0)
  }
}
