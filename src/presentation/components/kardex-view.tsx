"use client"

import { useState, useTransition } from "react"
import {
  ArrowDownRight,
  Boxes,
  Calendar,
  Layers,
  PackageMinus,
  Plus,
  TrendingDown,
  Warehouse,
} from "lucide-react"
import type { KardexRow } from "@/core/application/inventory-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { formatDate, toDateInput } from "@/lib/dates"
import {
  getKardexAction,
  registrarSalidaAction,
} from "@/presentation/actions/operations-actions"
import { AreaKardex } from "@/presentation/components/charts/area-kardex"
import { StatusBadge } from "@/presentation/components/status-badge"

interface ProductoOption {
  value: string
  label: string
}

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)

export function KardexView({ productos }: { productos: ProductoOption[] }) {
  const [productoId, setProductoId] = useState(productos[0]?.value ?? "")
  const [rows, setRows] = useState<KardexRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fecha, setFecha] = useState(toDateInput())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const load = (id: string) => {
    startTransition(async () => {
      const res = await getKardexAction(id)
      setRows(res.data ?? [])
      setLoaded(true)
    })
  }

  const onSelect = (id: string | null) => {
    if (!id) return
    setProductoId(id)
    load(id)
  }

  const onSalidaSubmit = (formData: FormData) => {
    setError(null)
    formData.set("productoId", productoId)
    startTransition(async () => {
      const res = await registrarSalidaAction({ ok: false }, formData)
      if (!res.ok) {
        setError(res.error ?? "Error al registrar la salida")
        return
      }
      setIsModalOpen(false)
      load(productoId)
    })
  }

  const saldo = rows[rows.length - 1]
  const productoActual = productos.find((p) => p.value === productoId)

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Control Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Warehouse className="size-5" />
          </span>
          <div className="flex-1 min-w-[240px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Insumo / Producto Seleccionado:
            </label>
            <Select
              value={productoId}
              onValueChange={onSelect}
              items={Object.fromEntries(productos.map((p) => [p.value, p.label]))}
            >
              <SelectTrigger className="h-9 font-semibold text-xs bg-muted/20 border-primary/20">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {productos.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={!productoId}
          className="gap-2 font-semibold shadow-xs shrink-0"
        >
          <PackageMinus className="size-4" />
          <span>Registrar Salida</span>
        </Button>
      </div>

      {/* Main Full-Width Kardex Display */}
      <Card className="shadow-xs">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold">
                  Historial Kardex PEPS
                </CardTitle>
                {productoActual && (
                  <Badge variant="outline" className="text-xs">
                    {productoActual.label}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                Valoración PEPS (Primeras Entradas, Primeras Salidas) de inventario acumulado.
              </CardDescription>
            </div>

            {saldo && (
              <div className="flex items-center gap-4 bg-muted/30 p-2.5 rounded-xl border border-border/80">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Existencia Actual
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {saldo.saldoCantidad.toLocaleString("es-MX")} unidades
                  </span>
                </div>
                <div className="h-7 w-[1px] bg-border" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Valoración Total PEPS
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {currency(saldo.saldoImporte)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 pt-6">
          {rows.length > 0 && (
            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <TrendingDown className="size-3.5 text-primary" />
                Comportamiento del Valor de Inventario ($)
              </h3>
              <AreaKardex
                rows={rows.map((r) => ({
                  fecha: r.fecha,
                  saldoImporte: r.saldoImporte,
                }))}
              />
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-bold">Fecha</TableHead>
                  <TableHead className="text-xs font-bold">Tipo Movimiento</TableHead>
                  <TableHead className="text-xs font-bold text-right">Cantidad</TableHead>
                  <TableHead className="text-xs font-bold text-right">Costo Unitario</TableHead>
                  <TableHead className="text-xs font-bold text-right">Importe</TableHead>
                  <TableHead className="text-xs font-bold text-right">Saldo Cantidad</TableHead>
                  <TableHead className="text-xs font-bold text-right">Saldo Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground text-xs"
                    >
                      {loaded ? "Sin movimientos registrados para este producto." : "Selecciona un producto arriba para cargar su kardex."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.movimientoId} className="hover:bg-muted/20 text-xs">
                      <TableCell className="font-medium">{formatDate(r.fecha)}</TableCell>
                      <TableCell>
                        <StatusBadge estado={r.tipo} />
                      </TableCell>
                      <TableCell className="text-right font-medium">{r.cantidad}</TableCell>
                      <TableCell className="text-right">{currency(r.costoUnitario)}</TableCell>
                      <TableCell className="text-right font-semibold">{currency(r.importe)}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{r.saldoCantidad}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        {currency(r.saldoImporte)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* REGISTRAR SALIDA DIALOG MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <PackageMinus className="size-5 text-rose-500" />
              Registrar Salida de Inventario
            </DialogTitle>
            <DialogDescription className="text-xs">
              El costo de salida se calculará automáticamente según las capas de costo PEPS del insumo.
            </DialogDescription>
          </DialogHeader>

          <form action={onSalidaSubmit} className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/40 p-3 text-xs border">
              <span className="font-semibold text-muted-foreground block mb-0.5">Producto:</span>
              <span className="font-bold text-foreground">{productoActual?.label}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cantidad" className="text-xs font-semibold">Cantidad a Retirar</Label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                min="1"
                required
                placeholder="Ej. 10"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fecha" className="text-xs font-semibold">Fecha de Operación</Label>
              <DatePicker
                id="fecha"
                name="fecha"
                value={fecha}
                onChange={setFecha}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="destino" className="text-xs font-semibold">Destino / Parcela / Ciclo</Label>
              <Input
                id="destino"
                name="destino"
                placeholder="Ej. Aplicación en Lote A-1 (Piña MD2)"
                className="h-9 text-xs"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-md">
                {error}
              </p>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="text-xs font-semibold">
                {pending ? "Registrando..." : "Confirmar Salida PEPS"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
