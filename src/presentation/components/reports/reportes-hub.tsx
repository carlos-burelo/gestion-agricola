"use client"

import {
  BarChart3,
  Boxes,
  CalendarClock,
  FileText,
  FlaskConical,
  Printer,
  Receipt,
  ShoppingCart,
  Sprout,
} from "lucide-react"
import { type ReactElement, useMemo, useState } from "react"
import { toast } from "sonner"
import type { NivelCosteo } from "@/core/application/costing-service"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  aging,
  egresosPorMes,
  estadoCuenta,
  filtrarPorFecha,
} from "@/lib/accounting"
import { formatDateLong, toDateInput } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { ReportesContext } from "@/presentation/reports-queries"
import { generarFolio } from "./report-shell"
import { AgingView } from "./aging-view"
import { CosteoView } from "./costeo-view"
import { EgresosView } from "./egresos-view"
import { EstadoCuentaView } from "./estado-cuenta-view"
import { InventarioView } from "./inventario-view"
import { KardexReportView } from "./kardex-report-view"
import { OrdenesView } from "./ordenes-view"
import { ProduccionView } from "./produccion-view"
import { SemilleroView } from "./semillero-view"

type ReportId =
  | "aging"
  | "estado"
  | "egresos"
  | "inventario"
  | "costeo"
  | "semillero"
  | "kardex"
  | "ordenes"
  | "produccion"

const CATALOGO: {
  id: ReportId
  titulo: string
  descripcion: string
  icon: typeof FileText
}[] = [
  { id: "aging", titulo: "Antigüedad de saldos", descripcion: "Cuentas por pagar por días de vencimiento.", icon: CalendarClock },
  { id: "estado", titulo: "Estado de cuenta", descripcion: "Movimientos y saldo por proveedor.", icon: FileText },
  { id: "egresos", titulo: "Egresos por periodo", descripcion: "Cuentas por pagar por mes.", icon: Receipt },
  { id: "costeo", titulo: "Costeo por nivel", descripcion: "Mano de obra e insumos por rancho/parcela/plantilla/ciclo.", icon: BarChart3 },
  { id: "semillero", titulo: "Costo de semillero", descripcion: "Costo unitario de planta producida.", icon: FlaskConical },
  { id: "kardex", titulo: "Kardex PEPS", descripcion: "Movimientos y saldo por producto.", icon: Boxes },
  { id: "ordenes", titulo: "Órdenes de compra", descripcion: "Compras por estado y periodo.", icon: ShoppingCart },
  { id: "produccion", titulo: "Producción de plantas", descripcion: "Sembradas y producidas por mes.", icon: Sprout },
  { id: "inventario", titulo: "Inventario valorizado", descripcion: "Existencias y valor PEPS.", icon: Boxes },
]

const ESTADOS_ORDEN = ["borrador", "autorizada", "parcial", "surtida", "cancelada"]
const ALL = "__all"
const hoyStr = () => formatDateLong(toDateInput())

export function ReportesHub({ ctx }: { ctx: ReportesContext }) {
  const [sel, setSel] = useState<ReportId>("aging")
  const [desde, setDesde] = useState(() => toDateInput(new Date(new Date().getFullYear() - 1, 0, 1)))
  const [hasta, setHasta] = useState(() => toDateInput())
  const [proveedorId, setProveedorId] = useState(ctx.proveedores[0]?.id ?? "")
  const [nivel, setNivel] = useState<NivelCosteo>("ranchoId")
  const [productoId, setProductoId] = useState(ctx.kardex[0]?.productoId ?? "")
  const [estadoOrden, setEstadoOrden] = useState<string>(ALL)
  const [busy, setBusy] = useState(false)

  const cxpsFiltradas = useMemo(
    () => filtrarPorFecha(ctx.cxps, desde || undefined, hasta || undefined),
    [ctx.cxps, desde, hasta],
  )
  const agingData = useMemo(
    () => aging(cxpsFiltradas, ctx.proveedores, new Date()),
    [cxpsFiltradas, ctx.proveedores],
  )
  const estadoData = useMemo(
    () => estadoCuenta(cxpsFiltradas, ctx.proveedores, proveedorId),
    [cxpsFiltradas, ctx.proveedores, proveedorId],
  )
  const egresosData = useMemo(() => egresosPorMes(cxpsFiltradas), [cxpsFiltradas])

  const costeoSel = useMemo(
    () => ctx.costeo.find((c) => c.nivel === nivel) ?? ctx.costeo[0],
    [ctx.costeo, nivel],
  )
  const kardexSel = useMemo(
    () => ctx.kardex.find((k) => k.productoId === productoId) ?? ctx.kardex[0],
    [ctx.kardex, productoId],
  )
  const ordenesData = useMemo(
    () =>
      ctx.ordenes.filter((o) => {
        if (estadoOrden !== ALL && o.estado !== estadoOrden) return false
        if (desde && o.fecha < desde) return false
        if (hasta && o.fecha > hasta) return false
        return true
      }),
    [ctx.ordenes, estadoOrden, desde, hasta],
  )
  const produccionData = useMemo(
    () =>
      ctx.produccion.filter((e) => {
        if (desde && e.mes < desde.slice(0, 7)) return false
        if (hasta && e.mes > hasta.slice(0, 7)) return false
        return true
      }),
    [ctx.produccion, desde, hasta],
  )

  const rango =
    desde || hasta
      ? `Periodo: ${desde || "inicio"} a ${hasta || "hoy"}`
      : undefined

  async function imprimir() {
    setBusy(true)
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const g = hoyStr()
      const folio = generarFolio()
      let doc: ReactElement
      if (sel === "aging") {
        const { AgingDoc } = await import("./report-doc-aging")
        doc = <AgingDoc generadoEl={g} folio={folio} filtros={rango} data={agingData} />
      } else if (sel === "estado") {
        const { EstadoCuentaDoc } = await import("./report-doc-estado-cuenta")
        doc = <EstadoCuentaDoc generadoEl={g} folio={folio} filtros={rango} data={estadoData} />
      } else if (sel === "egresos") {
        const { EgresosDoc } = await import("./report-doc-egresos")
        doc = <EgresosDoc generadoEl={g} folio={folio} filtros={rango} data={egresosData} />
      } else if (sel === "costeo" && costeoSel) {
        const { CosteoDoc } = await import("./report-doc-costeo")
        doc = <CosteoDoc generadoEl={g} folio={folio} data={costeoSel} />
      } else if (sel === "semillero") {
        const { SemilleroDoc } = await import("./report-doc-semillero")
        doc = <SemilleroDoc generadoEl={g} folio={folio} data={ctx.semilleros} />
      } else if (sel === "kardex" && kardexSel) {
        const { KardexDoc } = await import("./report-doc-kardex")
        doc = <KardexDoc generadoEl={g} folio={folio} data={kardexSel} />
      } else if (sel === "ordenes") {
        const { OrdenesDoc } = await import("./report-doc-ordenes")
        doc = <OrdenesDoc generadoEl={g} folio={folio} filtros={rango} data={ordenesData} />
      } else if (sel === "produccion") {
        const { ProduccionDoc } = await import("./report-doc-produccion")
        doc = <ProduccionDoc generadoEl={g} folio={folio} filtros={rango} data={produccionData} />
      } else {
        const { InventarioDoc } = await import("./report-doc-inventario")
        doc = <InventarioDoc generadoEl={g} folio={folio} inventario={ctx.inventario} />
      }
      const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob()
      const url = URL.createObjectURL(blob)
      const iframe = document.createElement("iframe")
      iframe.style.cssText =
        "position:fixed;right:0;bottom:0;width:0;height:0;border:0;"
      iframe.src = url
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        }, 1000)
      }
      document.body.appendChild(iframe)
      window.setTimeout(() => {
        iframe.remove()
        URL.revokeObjectURL(url)
      }, 60_000)
    } catch {
      toast.error("No se pudo generar el reporte")
    } finally {
      setBusy(false)
    }
  }

  const usaFechas = ["aging", "estado", "egresos", "ordenes", "produccion"].includes(sel)
  const usaProveedor = sel === "estado"
  const usaNivel = sel === "costeo"
  const usaProducto = sel === "kardex"
  const usaEstado = sel === "ordenes"
  const sinFiltros = !usaFechas && !usaProveedor && !usaNivel && !usaProducto && !usaEstado

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <nav className="flex flex-col gap-2">
        {CATALOGO.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSel(r.id)}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              sel === r.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <r.icon className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium text-foreground">
                {r.titulo}
              </span>
              <span className="block text-xs text-muted-foreground">
                {r.descripcion}
              </span>
            </span>
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
          {usaFechas && (
            <>
              <div className="grid gap-1.5">
                <Label className="text-xs">Desde</Label>
                <DatePicker value={desde} onChange={setDesde} placeholder="Desde" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Hasta</Label>
                <DatePicker value={hasta} onChange={setHasta} placeholder="Hasta" />
              </div>
            </>
          )}
          {usaProveedor && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Proveedor</Label>
              <Select
                value={proveedorId}
                onValueChange={(v) => v && setProveedorId(v)}
                items={Object.fromEntries(ctx.proveedores.map((p) => [p.id, p.razonSocial]))}
              >
                <SelectTrigger className="h-9 min-w-48"><SelectValue placeholder="Proveedor" /></SelectTrigger>
                <SelectContent>
                  {ctx.proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {usaNivel && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Nivel</Label>
              <Select
                value={nivel}
                onValueChange={(v) => v && setNivel(v as NivelCosteo)}
                items={Object.fromEntries(ctx.costeo.map((c) => [c.nivel, c.titulo]))}
              >
                <SelectTrigger className="h-9 min-w-40"><SelectValue placeholder="Nivel" /></SelectTrigger>
                <SelectContent>
                  {ctx.costeo.map((c) => (
                    <SelectItem key={c.nivel} value={c.nivel}>{c.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {usaProducto && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Producto</Label>
              <Select
                value={productoId}
                onValueChange={(v) => v && setProductoId(v)}
                items={Object.fromEntries(ctx.kardex.map((k) => [k.productoId, k.producto]))}
              >
                <SelectTrigger className="h-9 min-w-48"><SelectValue placeholder="Producto" /></SelectTrigger>
                <SelectContent>
                  {ctx.kardex.map((k) => (
                    <SelectItem key={k.productoId} value={k.productoId}>{k.producto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {usaEstado && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Estado</Label>
              <Select
                value={estadoOrden}
                onValueChange={(v) => v && setEstadoOrden(v)}
                items={{ [ALL]: "Todos", ...Object.fromEntries(ESTADOS_ORDEN.map((e) => [e, e])) }}
              >
                <SelectTrigger className="h-9 min-w-40 capitalize"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {ESTADOS_ORDEN.map((e) => (
                    <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {sinFiltros && (
            <span className="text-sm text-muted-foreground">Sin filtros para este reporte.</span>
          )}
          <Button onClick={imprimir} disabled={busy} className="ml-auto">
            <Printer className="size-4" />
            {busy ? "Generando…" : "Imprimir"}
          </Button>
        </div>

        {sel === "aging" && <AgingView data={agingData} />}
        {sel === "estado" && <EstadoCuentaView data={estadoData} />}
        {sel === "egresos" && <EgresosView data={egresosData} />}
        {sel === "costeo" && costeoSel && <CosteoView data={costeoSel} />}
        {sel === "semillero" && <SemilleroView data={ctx.semilleros} />}
        {sel === "kardex" && kardexSel && <KardexReportView data={kardexSel} />}
        {sel === "ordenes" && <OrdenesView data={ordenesData} />}
        {sel === "produccion" && <ProduccionView data={produccionData} />}
        {sel === "inventario" && <InventarioView inventario={ctx.inventario} />}
      </div>
    </div>
  )
}
