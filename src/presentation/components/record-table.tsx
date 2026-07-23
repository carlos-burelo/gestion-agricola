"use client"

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { cn } from "@/lib/utils"
import { deleteRecord } from "@/presentation/actions/crud-actions"
import type { FieldConfig, ModuleConfig } from "@/presentation/config/modules"
import type { ReferenceOption } from "@/presentation/queries"
import { CellContent, cellText } from "./record-cells"
import { EmptyState } from "./empty-state"
import { RecordForm } from "./record-form"

type RowT = Record<string, unknown>

interface RecordTableProps {
  config: ModuleConfig
  records: RowT[]
  referenceOptions: Record<string, ReferenceOption[]>
  labelMap: Record<string, string>
}

const ALL = "__all"

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ArrowUp className="size-3.5 text-primary" />
  if (dir === "desc") return <ArrowDown className="size-3.5 text-primary" />
  return <ChevronsUpDown className="size-3 opacity-40 group-hover/header:opacity-80" />
}

function ColumnHeaderFilter({
  field,
  column,
  labelMap,
}: {
  field: FieldConfig
  column: Column<RowT, unknown>
  labelMap: Record<string, string>
}) {
  const isSorted = column.getIsSorted()
  const filterValue = column.getFilterValue() as string | undefined
  const isFiltered = filterValue !== undefined && filterValue !== ALL && filterValue !== ""
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-1 group/header w-full">
      <button
        type="button"
        onClick={() => column.toggleSorting(isSorted === "asc")}
        className="flex items-center gap-1 font-semibold text-xs text-foreground/80 hover:text-foreground transition-colors truncate"
      >
        <span className="truncate">{field.label}</span>
        <SortIcon dir={isSorted} />
      </button>

      {/* Excel-style Filter Popover Button on Column Header */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn(
              "size-6 rounded p-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-all shrink-0",
              (isFiltered || isSorted) && "text-primary bg-primary/10 hover:bg-primary/20 opacity-100",
              !isFiltered && !isSorted && "opacity-0 group-hover/header:opacity-100"
            )}
            title={`Filtrar u ordenar ${field.label}`}
          >
            <Filter className={cn("size-3", isFiltered && "fill-primary text-primary")} />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-60 p-3 shadow-md border border-border bg-popover" align="start">
          <div className="flex flex-col gap-3">
            {/* Header Title */}
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-foreground truncate">
                Columna: {field.label}
              </span>
              {isFiltered && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium bg-primary/15 text-primary">
                  Filtrado
                </Badge>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ordenamiento
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant={isSorted === "asc" ? "default" : "outline"}
                  size="xs"
                  className="h-7 text-xs justify-start gap-1"
                  onClick={() => column.toggleSorting(false)}
                >
                  <ArrowUp className="size-3" /> A-Z
                </Button>
                <Button
                  variant={isSorted === "desc" ? "default" : "outline"}
                  size="xs"
                  className="h-7 text-xs justify-start gap-1"
                  onClick={() => column.toggleSorting(true)}
                >
                  <ArrowDown className="size-3" /> Z-A
                </Button>
              </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* Filter Control (Excel Style) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Filtro de columna
              </span>

              {field.type === "select" && field.options ? (
                <Select
                  value={filterValue ?? ALL}
                  onValueChange={(v) => {
                    column.setFilterValue(v === ALL ? undefined : v)
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-full bg-background">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={filterValue ?? ""}
                    onChange={(e) => column.setFilterValue(e.target.value || undefined)}
                    placeholder={`Filtrar por ${field.label.toLowerCase()}...`}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>
              )}
            </div>

            {/* Clear Filter button for this column */}
            {(isFiltered || isSorted) && (
              <Button
                variant="ghost"
                size="xs"
                className="h-7 text-xs text-muted-foreground hover:text-destructive justify-center gap-1 mt-1 border border-border/50"
                onClick={() => {
                  column.setFilterValue(undefined)
                  column.clearSorting()
                }}
              >
                <X className="size-3" /> Limpiar filtro
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function RowActions({
  config,
  referenceOptions,
  record,
}: {
  config: ModuleConfig
  referenceOptions: Record<string, ReferenceOption[]>
  record: RowT
}) {
  const [pending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleDeleteConfirm() {
    startTransition(async () => {
      const result = await deleteRecord(config.slug, String(record.id))
      if (result.ok) {
        toast.success("Registro eliminado exitosamente")
        setDeleteOpen(false)
      } else {
        toast.error(result.error ?? "No se pudo eliminar el registro")
      }
    })
  }

  return (
    <div className="flex justify-end gap-1">
      <RecordForm
        config={config}
        referenceOptions={referenceOptions}
        record={record}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Editar">
            <Pencil className="size-4" />
          </Button>
        }
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Eliminar"
            disabled={pending}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este registro de {config.singular.toLowerCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              {pending ? "Eliminando..." : "Eliminar Registro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function RecordTable({
  config,
  records,
  referenceOptions,
  labelMap,
}: RecordTableProps) {
  const displayFields = useMemo(
    () => config.fields.filter((f) => !f.hideInTable),
    [config],
  )
  const firstTextIdx = displayFields.findIndex(
    (f) => f.type === "text" || f.type === "reference",
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const globalFilterFn: FilterFn<RowT> = (row, _columnId, value) => {
    const q = String(value).toLowerCase().trim()
    if (!q) return true
    return displayFields.some((f) =>
      cellText(f, row.original[f.name], labelMap).toLowerCase().includes(q),
    )
  }

  const columns = useMemo<ColumnDef<RowT>[]>(() => {
    const cols: ColumnDef<RowT>[] = displayFields.map((f, idx) => ({
      id: f.name,
      accessorFn: (row) => cellText(f, row[f.name], labelMap),
      enableColumnFilter: true,
      filterFn: (row, _id, filterValue) => {
        if (!filterValue || filterValue === ALL) return true
        const val = String(row.original[f.name] ?? "").toLowerCase()
        const textVal = cellText(f, row.original[f.name], labelMap).toLowerCase()
        const target = String(filterValue).toLowerCase().trim()
        return val === target || val.includes(target) || textVal.includes(target)
      },
      header: ({ column }) => (
        <ColumnHeaderFilter field={f} column={column} labelMap={labelMap} />
      ),
      cell: ({ row }) => (
        <CellContent
          field={f}
          value={row.original[f.name]}
          labelMap={labelMap}
          emphasize={idx === firstTextIdx}
        />
      ),
    }))
    cols.push({
      id: "__actions",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <RowActions
          config={config}
          referenceOptions={referenceOptions}
          record={row.original}
        />
      ),
    })
    return cols
  }, [config, displayFields, firstTextIdx, labelMap, referenceOptions])

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const hasFilters = columnFilters.length > 0 || globalFilter.trim() !== ""
  const filtered = table.getFilteredRowModel().rows.length
  const rows = table.getRowModel().rows

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Clean Toolbar */}
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar en la tabla…"
              className="pl-8 text-xs"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs shrink-0 text-muted-foreground hover:text-destructive gap-1"
              onClick={() => {
                setColumnFilters([])
                setGlobalFilter("")
              }}
              title="Limpiar todos los filtros"
            >
              <X className="size-3.5" /> Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <RecordForm
            config={config}
            referenceOptions={referenceOptions}
            trigger={
              <Button className="gap-1.5 shadow-xs text-xs">
                <Plus className="size-4" /> Nuevo {config.singular.toLowerCase()}
              </Button>
            }
          />
        </div>
      </div>

      {/* Table with Excel-style Header Filters */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30 border-b border-border">
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className={cn(
                    "px-4 py-2.5",
                    h.column.id === "__actions" && "text-right",
                  )}
                >
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <EmptyState
                  message={
                    hasFilters
                      ? "Ningún registro coincide con los filtros aplicados."
                      : "Sin registros. Crea el primero con el botón de arriba."
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className="transition-colors hover:bg-muted/40"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "px-4 py-3 text-xs",
                      cell.column.id === "__actions" && "text-right",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-4 py-3 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          {filtered.toLocaleString("es-MX")} registro
          {filtered === 1 ? "" : "s"}
          {hasFilters ? " (filtrado)" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground tabular-nums">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
