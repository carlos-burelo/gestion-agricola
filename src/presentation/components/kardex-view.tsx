"use client"

import { useState, useTransition } from "react"
import type { KardexRow } from "@/core/application/inventory-service"
import { Button } from "@/components/ui/button"
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

  const onSalida = (formData: FormData) => {
    setError(null)
    formData.set("productoId", productoId)
    startTransition(async () => {
      const res = await registrarSalidaAction({ ok: false }, formData)
      if (!res.ok) {
        setError(res.error ?? "Error")
        return
      }
      load(productoId)
    })
  }

  const saldo = rows[rows.length - 1]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Registrar salida</CardTitle>
          <CardDescription>
            El costo se calcula automáticamente por PEPS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-2">
            <Label>Producto</Label>
            <Select
              value={productoId}
              onValueChange={onSelect}
              items={Object.fromEntries(productos.map((p) => [p.value, p.label]))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <form action={onSalida} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" name="cantidad" type="number" min="1" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="destino">Destino</Label>
              <Input id="destino" name="destino" placeholder="Ciclo / plantilla" />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending || !productoId}>
              Registrar salida
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Kardex PEPS</CardTitle>
          <CardDescription>
            {saldo
              ? `Existencia actual: ${saldo.saldoCantidad} u. · Valor: ${currency(saldo.saldoImporte)}`
              : "Selecciona un producto para ver su movimiento."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {rows.length > 0 && (
            <AreaKardex
              rows={rows.map((r) => ({
                fecha: r.fecha,
                saldoImporte: r.saldoImporte,
              }))}
            />
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">C. Unit.</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead className="text-right">Saldo cant.</TableHead>
                  <TableHead className="text-right">Saldo valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {loaded ? "Sin movimientos." : "Selecciona un producto."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.movimientoId}>
                      <TableCell>{r.fecha}</TableCell>
                      <TableCell>
                        <StatusBadge estado={r.tipo} />
                      </TableCell>
                      <TableCell className="text-right">{r.cantidad}</TableCell>
                      <TableCell className="text-right">
                        {currency(r.costoUnitario)}
                      </TableCell>
                      <TableCell className="text-right">
                        {currency(r.importe)}
                      </TableCell>
                      <TableCell className="text-right">{r.saldoCantidad}</TableCell>
                      <TableCell className="text-right">
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
    </div>
  )
}
