"use client"

import { useState, useTransition } from "react"
import { ArrowDownLeft, ArrowUpRight, Plus, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { toDateInput } from "@/lib/dates"
import type { Categoria } from "@/core/domain/entities"

interface CapturarMovimientoDialogProps {
  cuentaId: string
  cuentaNombre: string
  categoriasHoja: Categoria[]
  action: (formData: FormData) => Promise<void>
}

export function CapturarMovimientoDialog({
  cuentaId,
  cuentaNombre,
  categoriasHoja,
  action,
}: CapturarMovimientoDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [fecha, setFecha] = useState(toDateInput())

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await action(formData)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-semibold shadow-xs">
          <Plus className="size-4" />
          <span>Capturar Movimiento</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-5 text-primary" />
            Capturar Movimiento Bancario
          </DialogTitle>
          <DialogDescription className="text-xs">
            Registra una entrada o salida directa en la cuenta <strong className="text-foreground">{cuentaNombre}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha" className="text-xs font-semibold">Fecha</Label>
              <DatePicker
                id="fecha"
                name="fecha"
                value={fecha}
                onChange={setFecha}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direccion" className="text-xs font-semibold">Tipo Operación</Label>
              <Select name="direccion" defaultValue="entrada">
                <SelectTrigger id="direccion" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="entrada" className="text-xs">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <ArrowDownLeft className="size-3.5" /> Entrada (+)
                      </span>
                    </SelectItem>
                    <SelectItem value="salida" className="text-xs">
                      <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                        <ArrowUpRight className="size-3.5" /> Salida (-)
                      </span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monto" className="text-xs font-semibold">Monto ($)</Label>
            <Input
              id="monto"
              name="monto"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="h-9 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoriaId" className="text-xs font-semibold">Categoría</Label>
            <Select name="categoriaId">
              <SelectTrigger id="categoriaId" className="h-9 text-xs">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectGroup>
                  {categoriasHoja.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="beneficiario" className="text-xs font-semibold">Beneficiario / Origen</Label>
            <Input
              id="beneficiario"
              name="beneficiario"
              placeholder="Nombre de la persona o empresa"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="referencia" className="text-xs font-semibold">Referencia / Folio / Factura</Label>
            <Input
              id="referencia"
              name="referencia"
              placeholder="Ej. SPEI-880912"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion" className="text-xs font-semibold">Observaciones</Label>
            <Input
              id="descripcion"
              name="descripcion"
              placeholder="Detalle adicional de la transacción"
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="text-xs font-semibold">
              {pending ? "Guardando..." : "Guardar Movimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
