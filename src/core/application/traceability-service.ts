import type {
  Cotizacion,
  CuentaPorPagar,
  OrdenCompra,
  Recepcion,
  Requerimiento,
  ValeSalida,
} from "@/core/domain/entities"
import type { Repository } from "@/core/domain/repositories"

export interface TraceStep {
  etapa: string
  referencia: string
  fecha: string
  detalle: string
  encontrado: boolean
}

/**
 * Traceability use-case: reconstructs the full procurement-to-field chain
 * starting from a requirement (requerimiento):
 *   Solicitud → Cotización → Orden → Recepción → Factura → CxP → Salida → Campo
 */
export class TraceabilityService {
  constructor(
    private readonly requerimientos: Repository<Requerimiento>,
    private readonly cotizaciones: Repository<Cotizacion>,
    private readonly ordenes: Repository<OrdenCompra>,
    private readonly recepciones: Repository<Recepcion>,
    private readonly cuentas: Repository<CuentaPorPagar>,
    private readonly vales: Repository<ValeSalida>,
  ) {}

  async trazar(requerimientoId: string): Promise<TraceStep[]> {
    const steps: TraceStep[] = []

    const req = await this.requerimientos.findById(requerimientoId)
    steps.push({
      etapa: "Solicitud",
      referencia: req?.folio ?? "—",
      fecha: req?.fecha ?? "",
      detalle: req ? `${req.detalles.length} producto(s)` : "No encontrada",
      encontrado: Boolean(req),
    })
    if (!req) return steps

    const [cot] = await this.cotizaciones.findBy({ requerimientoId: req.id })
    steps.push({
      etapa: "Cotización",
      referencia: cot?.id ?? "—",
      fecha: cot?.fecha ?? "",
      detalle: cot ? `Estado: ${cot.estado}` : "Sin cotización",
      encontrado: Boolean(cot),
    })

    const proveedorId = cot?.proveedorId
    const [orden] = proveedorId
      ? await this.ordenes.findBy({ proveedorId })
      : []
    steps.push({
      etapa: "Orden de compra",
      referencia: orden?.folio ?? "—",
      fecha: orden?.fecha ?? "",
      detalle: orden ? `Estado: ${orden.estado}` : "Sin orden",
      encontrado: Boolean(orden),
    })

    const [recepcion] = orden
      ? await this.recepciones.findBy({ ordenCompraId: orden.id })
      : []
    steps.push({
      etapa: "Recepción / Factura",
      referencia: recepcion?.factura ?? "—",
      fecha: recepcion?.fecha ?? "",
      detalle: recepcion
        ? `${recepcion.detalles.length} producto(s) recibido(s)`
        : "Sin recepción",
      encontrado: Boolean(recepcion),
    })

    const [cxp] = recepcion
      ? await this.cuentas.findBy({ factura: recepcion.factura })
      : []
    steps.push({
      etapa: "Cuenta por pagar",
      referencia: cxp?.factura ?? "—",
      fecha: cxp?.fechaVencimiento ?? "",
      detalle: cxp ? `Importe: $${cxp.importe} (${cxp.estado})` : "Sin CxP",
      encontrado: Boolean(cxp),
    })

    const productoIds = new Set(req.detalles.map((d) => d.productoId))
    const valesRelacionados = (await this.vales.findAll()).filter((v) =>
      v.detalles.some((d) => productoIds.has(d.productoId)),
    )
    const vale = valesRelacionados[0]
    steps.push({
      etapa: "Salida de inventario → Campo",
      referencia: vale?.folio ?? "—",
      fecha: vale?.fecha ?? "",
      detalle: vale
        ? `Aplicado en ciclo ${vale.cicloId}`
        : "Sin aplicación en campo",
      encontrado: Boolean(vale),
    })

    return steps
  }
}
