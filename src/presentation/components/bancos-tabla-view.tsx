"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Banknote,
  Building2,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Pencil,
  Plus,
  Receipt,
  Repeat2,
  Search,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react"
import type { Categoria, Cuenta, Familiar, Movimiento } from "@/core/domain/entities"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { createRecord, deleteRecord, updateRecord } from "@/presentation/actions/crud-actions"
import { toast } from "sonner"

export interface BancosTablaViewProps {
  cuentas: Cuenta[]
  saldos: Record<string, number>
  movimientosRecientes: Movimiento[]
  categorias: Categoria[]
  familiares: Familiar[]
  isAdmin: boolean
}

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(n)

/** Bank Custom Badge helper */
function getBankBadge(bancoNombre?: string, tipo?: string) {
  const name = (bancoNombre || tipo || "").toUpperCase()
  if (name.includes("BBVA")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
        <Landmark className="size-3.5" />
        BBVA Bancomer
      </span>
    )
  }
  if (name.includes("BANAMEX") || name.includes("CITI")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
        <Building2 className="size-3.5" />
        Citibanamex
      </span>
    )
  }
  if (name.includes("SANTANDER")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400">
        <CreditCard className="size-3.5" />
        Santander
      </span>
    )
  }
  if (name.includes("BANORTE")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
        <CreditCard className="size-3.5" />
        Banorte
      </span>
    )
  }
  if (tipo === "efectivo" || name.includes("EFECTIVO") || name.includes("CAJA")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
        <Banknote className="size-3.5" />
        Efectivo / Caja
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
      <Wallet className="size-3.5 text-muted-foreground" />
      {bancoNombre || "Institución Bancaria"}
    </span>
  )
}

export function BancosTablaView({
  cuentas,
  saldos,
  movimientosRecientes,
  categorias,
  familiares,
  isAdmin,
}: BancosTablaViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showBalance, setShowBalance] = useState(true)

  // Dialog State for Creation & Editing
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [nombre, setNombre] = useState("")
  const [familiarId, setFamiliarId] = useState("")
  const [bancoNombre, setBancoNombre] = useState("")
  const [tipo, setTipo] = useState("banco")
  const [numeroCuenta, setNumeroCuenta] = useState("")
  const [moneda, setMoneda] = useState("MXN")
  const [saldoInicial, setSaldoInicial] = useState("0")
  const [estado, setEstado] = useState("activo")

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null)

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !familiarId) {
      toast.error("Ingresa el nombre de la cuenta y selecciona un socio titular")
      return
    }
    setIsSubmitting(true)
    try {
      const selectedFamiliar = familiares.find((f) => f.id === familiarId)
      const res = await createRecord("bancos", {
        nombre,
        titularTipo: "familiar",
        titularNombre: selectedFamiliar?.nombre || "",
        familiarId,
        bancoNombre,
        numeroCuenta,
        tipo,
        moneda,
        saldoInicial,
        estado,
      })
      if (res.ok) {
        toast.success("Cuenta bancaria registrada exitosamente")
        setIsCreateOpen(false)
      } else {
        toast.error(res.error || "Error al registrar la cuenta")
      }
    } catch {
      toast.error("Error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCuenta || !nombre.trim() || !familiarId) return
    setIsSubmitting(true)
    try {
      const selectedFamiliar = familiares.find((f) => f.id === familiarId)
      const res = await updateRecord("bancos", editingCuenta.id, {
        nombre,
        titularTipo: "familiar",
        titularNombre: selectedFamiliar?.nombre || "",
        familiarId,
        bancoNombre,
        numeroCuenta,
        tipo,
        moneda,
        saldoInicial,
        estado,
      })
      if (res.ok) {
        toast.success("Cuenta bancaria actualizada correctamente")
        setEditingCuenta(null)
      } else {
        toast.error(res.error || "Error al actualizar la cuenta")
      }
    } catch {
      toast.error("Error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsSubmitting(true)
    try {
      const res = await deleteRecord("bancos", deleteTarget.id)
      if (res.ok) {
        toast.success("Cuenta eliminada correctamente")
        setDeleteTarget(null)
      } else {
        toast.error(res.error || "Error al eliminar la cuenta")
      }
    } catch {
      toast.error("Error al eliminar la cuenta")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalBalance = cuentas.reduce(
    (acc, c) => acc + (saldos[c.id] ?? c.saldoInicial),
    0
  )

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Número de cuenta copiado")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openCreateModal = () => {
    setNombre("")
    setFamiliarId(familiares[0]?.id || "")
    setBancoNombre("BBVA Bancomer")
    setTipo("banco")
    setNumeroCuenta("")
    setMoneda("MXN")
    setSaldoInicial("100000")
    setEstado("activo")
    setIsCreateOpen(true)
  }

  const openEditModal = (c: Cuenta) => {
    setEditingCuenta(c)
    setNombre(c.nombre)
    setFamiliarId(c.familiarId || familiares[0]?.id || "")
    setBancoNombre(c.bancoNombre || "")
    setTipo(c.tipo)
    setNumeroCuenta(c.numeroCuenta || "")
    setMoneda(c.moneda)
    setSaldoInicial(String(c.saldoInicial))
    setEstado(c.estado)
  }

  // Filter accounts
  const filteredCuentas = cuentas.filter((c) => {
    const query = searchTerm.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(query) ||
      (c.bancoNombre ?? "").toLowerCase().includes(query) ||
      (c.titularNombre ?? "").toLowerCase().includes(query) ||
      (c.numeroCuenta ?? "").toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header Banner & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500" />
            Cuentas Bancarias de los Socios &middot; MGZ, S. de P.R. de R.L.
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {showBalance ? currency(totalBalance) : "••••••••••••"}
            </h1>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showBalance ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Saldo acumulado global en {cuentas.length} cuentas bancarias
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button asChild className="gap-2 font-semibold">
              <Link href="/dashboard/bancos/transferencias">
                <Repeat2 className="size-4" />
                Hacer Traspaso
              </Link>
            </Button>
          )}
          <Button onClick={openCreateModal} className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="size-4" />
            Nueva Cuenta Bancaria
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/bancos/estados-de-cuenta">
              <Receipt className="size-4" />
              Estado de Cuenta
            </Link>
          </Button>
        </div>
      </div>

      {/* Cuentas Table Section */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold">Catálogo de Cuentas Bancarias</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Administración de cuentas activas de los socios.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por banco, socio o cuenta..."
              className="pl-9 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs uppercase">
                  <TableHead className="font-bold">Banco</TableHead>
                  <TableHead className="font-bold">Nombre de la Cuenta</TableHead>
                  <TableHead className="font-bold">Socio / Titular</TableHead>
                  <TableHead className="font-bold">Núm. Cuenta / CLABE</TableHead>
                  <TableHead className="font-bold text-center">Moneda</TableHead>
                  <TableHead className="font-bold text-right">Saldo Actual</TableHead>
                  <TableHead className="font-bold text-center">Estado</TableHead>
                  <TableHead className="font-bold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCuentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      No se encontraron cuentas bancarias.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCuentas.map((c) => {
                    const saldoActual = saldos[c.id] ?? c.saldoInicial
                    return (
                      <TableRow key={c.id} className="text-xs hover:bg-muted/30">
                        {/* Banco Badge */}
                        <TableCell>{getBankBadge(c.bancoNombre, c.tipo)}</TableCell>

                        {/* Nombre de Cuenta */}
                        <TableCell className="font-bold text-foreground">
                          <Link
                            href={`/dashboard/tesoreria/${c.id}`}
                            className="hover:underline hover:text-primary"
                          >
                            {c.nombre}
                          </Link>
                        </TableCell>

                        {/* Socio / Titular */}
                        <TableCell>
                          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                            {c.titularNombre || "Socio Principal"}
                          </Badge>
                        </TableCell>

                        {/* Numero de Cuenta / CLABE */}
                        <TableCell className="font-mono text-muted-foreground">
                          {c.numeroCuenta ? (
                            <div className="flex items-center gap-1.5">
                              <span>{c.numeroCuenta}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(c.numeroCuenta!, c.id)}
                                title="Copiar cuenta"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {copiedId === c.id ? (
                                  <Check className="size-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            "---"
                          )}
                        </TableCell>

                        {/* Moneda */}
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {c.moneda}
                          </Badge>
                        </TableCell>

                        {/* Saldo Actual */}
                        <TableCell className="text-right font-extrabold text-foreground text-sm">
                          {showBalance ? currency(saldoActual) : "••••••••"}
                        </TableCell>

                        {/* Estado */}
                        <TableCell className="text-center">
                          <Badge
                            variant={c.estado === "activo" ? "default" : "secondary"}
                            className="text-[10px] uppercase font-bold"
                          >
                            {c.estado}
                          </Badge>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditModal(c)}
                              title="Editar cuenta"
                            >
                              <Pencil className="size-3.5" />
                            </Button>

                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-medium"
                            >
                              <Link href={`/dashboard/tesoreria/${c.id}`}>
                                Movimientos
                              </Link>
                            </Button>

                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setDeleteTarget({ id: c.id, nombre: c.nombre })}
                                  title="Eliminar cuenta"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-emerald-500" />
              Nueva Cuenta Bancaria
            </DialogTitle>
            <DialogDescription>
              Registra una nueva cuenta bancaria a nombre de un socio de la empresa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-nombre">Nombre de la Cuenta</Label>
              <Input
                id="create-nombre"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. BBVA Bancomer Corporativa"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-familiarId">Socio / Titular</Label>
              <Select value={familiarId} onValueChange={setFamiliarId}>
                <SelectTrigger id="create-familiarId" name="familiarId" className="w-full">
                  <SelectValue placeholder="Selecciona el socio titular" />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-bancoNombre">Banco / Institución</Label>
                <Input
                  id="create-bancoNombre"
                  name="bancoNombre"
                  value={bancoNombre}
                  onChange={(e) => setBancoNombre(e.target.value)}
                  placeholder="Ej. BBVA, Citibanamex"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-tipo">Tipo de Cuenta</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="create-tipo" name="tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banco">Banco</SelectItem>
                    <SelectItem value="efectivo">Efectivo / Caja</SelectItem>
                    <SelectItem value="persona">Persona</SelectItem>
                    <SelectItem value="reserva">Reserva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-numeroCuenta">Núm. Cuenta / CLABE</Label>
                <Input
                  id="create-numeroCuenta"
                  name="numeroCuenta"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="012345678901234567"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-saldoInicial">Saldo Inicial ($)</Label>
                <Input
                  id="create-saldoInicial"
                  name="saldoInicial"
                  type="number"
                  step="0.01"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white hover:bg-emerald-500">
                {isSubmitting ? "Registrando..." : "Registrar Cuenta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={!!editingCuenta} onOpenChange={(open) => !open && setEditingCuenta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 text-primary" />
              Editar Cuenta Bancaria
            </DialogTitle>
            <DialogDescription>
              Modifica los datos de la cuenta bancaria del socio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nombre">Nombre de la Cuenta</Label>
              <Input
                id="edit-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. BBVA Bancomer Corporativa"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-familiarId">Socio / Titular</Label>
              <Select value={familiarId} onValueChange={setFamiliarId}>
                <SelectTrigger id="edit-familiarId" className="w-full">
                  <SelectValue placeholder="Selecciona el socio titular" />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-bancoNombre">Banco / Institución</Label>
                <Input
                  id="edit-bancoNombre"
                  value={bancoNombre}
                  onChange={(e) => setBancoNombre(e.target.value)}
                  placeholder="Ej. BBVA, Citibanamex"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-tipo">Tipo de Cuenta</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="edit-tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banco">Banco</SelectItem>
                    <SelectItem value="efectivo">Efectivo / Caja</SelectItem>
                    <SelectItem value="persona">Persona</SelectItem>
                    <SelectItem value="reserva">Reserva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-numeroCuenta">Núm. Cuenta / CLABE</Label>
                <Input
                  id="edit-numeroCuenta"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="012345678901234567"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-saldoInicial">Saldo Inicial ($)</Label>
                <Input
                  id="edit-saldoInicial"
                  type="number"
                  step="0.01"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCuenta(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta bancaria?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la cuenta &quot;{deleteTarget?.nombre}&quot;? Esta acción no se puede deshacer y afectará los registros asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              {isSubmitting ? "Eliminando..." : "Eliminar Cuenta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
