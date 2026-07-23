"use client"

import { useState } from "react"
import {
  Banknote,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Plus,
  Receipt,
  Save,
  Search,
  Trash2,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import type {
  CatGastoAdministrativo,
  CatGastoFamilia,
  CatGastoOperativo,
  Cuenta,
  Familiar,
  GastoExterno,
} from "@/core/domain/entities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createRecord, deleteRecord } from "@/presentation/actions/crud-actions"

export interface OtrosGastosViewProps {
  gastos: GastoExterno[]
  catFamilia: CatGastoFamilia[]
  catOperativos: CatGastoOperativo[]
  catAdministrativos: CatGastoAdministrativo[]
  familiares: Familiar[]
  cuentas: Cuenta[]
}

export function OtrosGastosView({
  gastos,
  catFamilia,
  catOperativos,
  catAdministrativos,
  familiares,
  cuentas,
}: OtrosGastosViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<string>("todos")

  // Form States
  const today = new Date().toISOString().split("T")[0]
  const [fecha, setFecha] = useState(today)
  const [tipoGasto, setTipoGasto] = useState<"familiar" | "operativo" | "administrativo">("familiar")
  const [catGastoId, setCatGastoId] = useState<string>(catFamilia[0]?.id ?? "")
  const [folioFactura, setFolioFactura] = useState("")
  const [monto, setMonto] = useState("")

  // Forma de Pago States
  const [formaPago, setFormaPago] = useState("Transferencia SPEI")
  const [bancoCuentaId, setBancoCuentaId] = useState<string>(cuentas[0]?.id ?? "")
  const [noTransferencia, setNoTransferencia] = useState("")

  // Familiar State
  const [familiarId, setFamiliarId] = useState<string>(familiares[0]?.id ?? "")

  // Dynamic Concept Options based on Selected TipoGasto
  const getConceptOptions = () => {
    switch (tipoGasto) {
      case "familiar":
        return catFamilia.map((c) => ({ id: c.id, label: c.concepto }))
      case "operativo":
        return catOperativos.map((c) => ({ id: c.id, label: c.concepto }))
      case "administrativo":
        return catAdministrativos.map((c) => ({ id: c.id, label: c.concepto }))
      default:
        return []
    }
  }

  const handleTipoGastoChange = (val: "familiar" | "operativo" | "administrativo") => {
    setTipoGasto(val)
    if (val === "familiar") {
      setCatGastoId(catFamilia[0]?.id ?? "")
    } else if (val === "operativo") {
      setCatGastoId(catOperativos[0]?.id ?? "")
    } else if (val === "administrativo") {
      setCatGastoId(catAdministrativos[0]?.id ?? "")
    }
  }

  const selectedCuenta = cuentas.find((c) => c.id === bancoCuentaId)
  const selectedFamiliar = familiares.find((f) => f.id === familiarId)
  const conceptOptions = getConceptOptions()

  // Generate dynamic display header date string e.g. "HOY ES 22 DE JULIO DE 2026"
  const getFormattedHeaderDate = () => {
    const d = new Date()
    const months = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ]
    return `HOY ES ${d.getDate()} DE ${months[d.getMonth()]} DE ${d.getFullYear()}`
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!monto || Number(monto) <= 0) {
      toast.error("Por favor ingresa un monto válido mayor a 0")
      return
    }

    if (!bancoCuentaId) {
      toast.error("Por favor selecciona una cuenta o banco emisor")
      return
    }

    setIsSubmitting(true)

    try {
      const conceptoObj = conceptOptions.find((c) => c.id === catGastoId)
      const conceptoTexto = conceptoObj ? conceptoObj.label : "Gasto Varios"

      const obsText = `Forma de Pago: ${formaPago}. Ref/Cheque: ${noTransferencia || "N/A"}. Concepto: ${conceptoTexto}`

      const res = await createRecord("gastos-externos", {
        tipoGasto,
        catGastoId,
        familiarId: tipoGasto === "familiar" ? familiarId : "",
        bancoCuentaId,
        monto,
        fecha,
        folioFactura: folioFactura.trim() || `FAC-${Date.now().toString().slice(-6)}`,
        observaciones: obsText,
      })

      if (res.ok) {
        toast.success("Gasto registrado y grabado correctamente")
        setMonto("")
        setFolioFactura("")
        setNoTransferencia("")
      } else {
        toast.error(res.error || "No se pudo grabar el gasto")
      }
    } catch {
      toast.error("Error inesperado al grabar el gasto")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Record Deletion
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    try {
      const res = await deleteRecord("gastosExternos", deletingId)
      if (res.ok) {
        toast.success("Gasto eliminado exitosamente")
        setDeletingId(null)
      } else {
        toast.error(res.error || "No se pudo eliminar el gasto")
      }
    } catch {
      toast.error("Error al eliminar gasto")
    }
  }

  // Helper Maps for Rendering Table
  const getCatLabel = (gasto: GastoExterno) => {
    if (gasto.tipoGasto === "familiar") {
      return catFamilia.find((c) => c.id === gasto.catGastoId)?.concepto || "Gasto Familiar"
    }
    if (gasto.tipoGasto === "operativo") {
      return catOperativos.find((c) => c.id === gasto.catGastoId)?.concepto || "Gasto Operativo"
    }
    return catAdministrativos.find((c) => c.id === gasto.catGastoId)?.concepto || "Gasto Administrativo"
  }

  const getCuentaLabel = (id: string) => cuentas.find((c) => c.id === id)?.nombre || id
  const getFamiliarLabel = (id?: string) => familiares.find((f) => f.id === id)?.nombre || "-"

  // Filtered Gastos List
  const filteredGastos = gastos.filter((g) => {
    const matchesTipo = filterTipo === "todos" || g.tipoGasto === filterTipo
    const catName = getCatLabel(g).toLowerCase()
    const obs = (g.observaciones || "").toLowerCase()
    const folio = (g.folioFactura || "").toLowerCase()
    const search = searchTerm.toLowerCase()
    return matchesTipo && (catName.includes(search) || obs.includes(search) || folio.includes(search))
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Main Module Card - Clean Solid Theme without heavy gradients */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        {/* Clean Header Bar */}
        <div className="border-b border-border bg-muted/30 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">
                  Otros Gastos
                </h1>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {getFormattedHeaderDate()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs font-semibold">
                FOLIO CONSECUTIVO AUTOMÁTICO
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: FECHA, Tipo de Gastos, CONCEPTO, FOLIO FACTURA, MONTO */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
              {/* FECHA */}
              <div className="space-y-1.5 lg:col-span-3">
                <Label htmlFor="gasto-fecha" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  Fecha
                </Label>
                <Input
                  id="gasto-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>

              {/* Tipo de Gastos - Shadcn Select */}
              <div className="space-y-1.5 lg:col-span-3">
                <Label htmlFor="gasto-tipo" className="text-xs font-semibold text-foreground">
                  Tipo de Gastos
                </Label>
                <Select
                  value={tipoGasto}
                  onValueChange={(val: "familiar" | "operativo" | "administrativo") => handleTipoGastoChange(val)}
                >
                  <SelectTrigger id="gasto-tipo" className="w-full">
                    <SelectValue placeholder="Selecciona tipo de gasto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="familiar">Gasto Familiar</SelectItem>
                    <SelectItem value="operativo">Gasto Operativo</SelectItem>
                    <SelectItem value="administrativo">Gasto Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* CONCEPTO - Dynamic Shadcn Select */}
              <div className="space-y-1.5 lg:col-span-6">
                <Label htmlFor="gasto-cat" className="text-xs font-semibold text-foreground">
                  Concepto
                </Label>
                <Select value={catGastoId} onValueChange={setCatGastoId}>
                  <SelectTrigger id="gasto-cat" className="w-full">
                    <SelectValue placeholder="Selecciona concepto de gasto" />
                  </SelectTrigger>
                  <SelectContent>
                    {conceptOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* FOLIO FACTURA */}
              <div className="space-y-1.5 lg:col-span-6">
                <Label htmlFor="gasto-folio" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" />
                  Folio Factura / Comprobante
                </Label>
                <Input
                  id="gasto-folio"
                  type="text"
                  value={folioFactura}
                  onChange={(e) => setFolioFactura(e.target.value)}
                  placeholder="Ej. FAC-99082"
                />
              </div>

              {/* MONTO ($) */}
              <div className="space-y-1.5 lg:col-span-6">
                <Label htmlFor="gasto-monto" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-primary" />
                  Monto ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-foreground">
                    $
                  </span>
                  <Input
                    id="gasto-monto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 font-mono text-base font-bold text-foreground"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Split Section: FORMA DE PAGO & FAMILIARES */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Box 1: FORMA DE PAGO */}
              <div className="rounded-xl border border-border bg-card p-5 lg:col-span-7">
                <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <CreditCard className="size-4 text-primary" />
                  <h2 className="text-xs font-bold tracking-wider uppercase text-foreground">
                    Forma de Pago
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Forma de pago - Shadcn Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="pago-forma" className="text-xs font-semibold text-muted-foreground">
                      Forma de pago
                    </Label>
                    <Select value={formaPago} onValueChange={setFormaPago}>
                      <SelectTrigger id="pago-forma" className="w-full">
                        <SelectValue placeholder="Selecciona forma de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Transferencia SPEI">Transferencia SPEI</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Efectivo">Efectivo / Caja Chica</SelectItem>
                        <SelectItem value="Depósito Ventanilla">Depósito Ventanilla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Banco emisor / Cuenta Origen - Shadcn Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="pago-cuenta" className="text-xs font-semibold text-muted-foreground">
                      Banco Emisor / Cuenta Origen
                    </Label>
                    <Select value={bancoCuentaId} onValueChange={setBancoCuentaId}>
                      <SelectTrigger id="pago-cuenta" className="w-full">
                        <SelectValue placeholder="Selecciona cuenta emisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuentas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {(c.bancoNombre || c.nombre)} &middot; {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Detalle de cuenta seleccionada */}
                  {selectedCuenta && (
                    <div className="col-span-full rounded-lg border border-border bg-muted/40 p-3 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Banco / Titular:</span>
                        <span className="font-semibold text-foreground">
                          {selectedCuenta.bancoNombre || "Efectivo"} &middot; {selectedCuenta.titularNombre || selectedCuenta.nombre}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-muted-foreground">Número de Cuenta / CLABE:</span>
                        <span className="font-mono font-bold text-foreground">
                          {selectedCuenta.numeroCuenta || "CAJA CHICA"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* no. Transferencia / cheque */}
                  <div className="col-span-full space-y-1.5">
                    <Label htmlFor="pago-ref" className="text-xs font-semibold text-muted-foreground">
                      No. Transferencia / Cheque
                    </Label>
                    <Input
                      id="pago-ref"
                      type="text"
                      value={noTransferencia}
                      onChange={(e) => setNoTransferencia(e.target.value)}
                      placeholder="Ej. SPEI-990812 o Cheque #004"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: FAMILIARES (Active when tipoGasto === 'familiar') */}
              <div className="rounded-xl border border-border bg-card p-5 lg:col-span-5">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    <h2 className="text-xs font-bold tracking-wider uppercase text-foreground">
                      Familiares
                    </h2>
                  </div>
                  {tipoGasto === "familiar" ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] opacity-50">
                      No Aplica
                    </Badge>
                  )}
                </div>

                {tipoGasto === "familiar" ? (
                  <div className="space-y-4">
                    {/* Beneficiario - Shadcn Select */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fam-beneficiario" className="text-xs font-semibold text-muted-foreground">
                        Beneficiario Familiar
                      </Label>
                      <Select value={familiarId} onValueChange={setFamiliarId}>
                        <SelectTrigger id="fam-beneficiario" className="w-full">
                          <SelectValue placeholder="Selecciona familiar" />
                        </SelectTrigger>
                        <SelectContent>
                          {familiares.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.nombre} ({f.parentesco})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Resumen Table Replicating Legacy Grid */}
                    <div className="overflow-hidden rounded-lg border border-border bg-background">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-muted/60 font-semibold text-muted-foreground">
                          <tr>
                            <th className="p-2.5">Nombre / Beneficiario</th>
                            <th className="p-2.5 text-right">Importe ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/50">
                            <td className="p-2.5 font-medium text-foreground">
                              {selectedFamiliar?.nombre || "Sin seleccionar"}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-foreground">
                              {monto ? `$${Number(monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "$0.00"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-muted-foreground">
                    <UserCheck className="mb-2 size-8 opacity-30" />
                    <span>Selecciona &quot;Gasto Familiar&quot; en Tipo de Gastos para asociar un beneficiario familiar.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar with GRABAR button */}
            <div className="flex items-center justify-end border-t border-border pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="gap-2 font-bold shadow-xs"
              >
                <Save className="size-4" />
                {isSubmitting ? "GUARDANDO..." : "GRABAR GASTO"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History Table Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              Historial de Otros Gastos Registrados
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Consulta, filtrado y eliminación de registros de gastos capturados.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por concepto o folio..."
                className="pl-9 text-xs"
              />
            </div>

            {/* Filter - Shadcn Select */}
            <div className="w-full sm:w-48">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Tipos</SelectItem>
                  <SelectItem value="familiar">Solo Familiares</SelectItem>
                  <SelectItem value="operativo">Solo Operativos</SelectItem>
                  <SelectItem value="administrativo">Solo Administrativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/60 font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Concepto</th>
                  <th className="p-3.5">Familiar</th>
                  <th className="p-3.5">Cuenta Origen</th>
                  <th className="p-3.5">Folio Factura</th>
                  <th className="p-3.5 text-right">Monto ($)</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGastos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No hay registros de otros gastos capturados.
                    </td>
                  </tr>
                ) : (
                  filteredGastos.map((g) => (
                    <tr key={g.id} className="transition-colors hover:bg-muted/40">
                      <td className="p-3.5 font-mono font-medium">
                        {new Date(g.fecha).toLocaleDateString("es-MX")}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant="secondary"
                          className="capitalize text-[10px]"
                        >
                          {g.tipoGasto}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-semibold text-foreground">
                        {getCatLabel(g)}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {getFamiliarLabel(g.familiarId)}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {getCuentaLabel(g.bancoCuentaId)}
                      </td>
                      <td className="p-3.5 font-mono font-medium">
                        {g.folioFactura || "-"}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-foreground">
                        ${g.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(g.id)}
                          className="size-7 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro de gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este registro de gasto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              Eliminar Gasto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
