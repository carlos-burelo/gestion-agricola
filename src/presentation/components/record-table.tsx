"use client"

import {
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
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import type { ModuleConfig } from "@/presentation/config/modules"
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
  if (dir === "asc") return <ArrowUp className="size-3.5" />
  if (dir === "desc") return <ArrowDown className="size-3.5" />
  return <ChevronsUpDown className="size-3.5 opacity-50" />
}

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
  function handleDelete() {
    if (!confirm("¿Eliminar este registro?")) return
    startTransition(async () => {
      const result = await deleteRecord(config.slug, String(record.id))
      if (result.ok) toast.success("Registro eliminado")
      else toast.error(result.error ?? "No se pudo eliminar")
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
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Eliminar"
        disabled={pending}
        onClick={handleDelete}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
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
  const selectFields = useMemo(
    () => displayFields.filter((f) => f.type === "select"),
    [displayFields],
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
      enableColumnFilter: f.type === "select",
      filterFn: (row, _id, filterValue) =>
        filterValue === ALL ||
        filterValue === undefined ||
        String(row.original[f.name]) === filterValue,
      header: ({ column }) => (
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {f.label}
          <SortIcon dir={column.getIsSorted()} />
        </button>
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
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectFields.map((f) => {
            const current =
              (columnFilters.find((c) => c.id === f.name)?.value as string) ??
              ALL
            return (
              <Select
                key={f.name}
                value={current}
                onValueChange={(v) =>
                  table
                    .getColumn(f.name)
                    ?.setFilterValue(v === ALL ? undefined : v)
                }
                items={{
                  [ALL]: `${f.label}: todos`,
                  ...Object.fromEntries(
                    (f.options ?? []).map((o) => [o.value, o.label]),
                  ),
                }}
              >
                <SelectTrigger className="h-9 w-auto min-w-32">
                  <SelectValue placeholder={f.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{f.label}: todos</SelectItem>
                  {f.options?.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          })}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setColumnFilters([])
                setGlobalFilter("")
              }}
            >
              <X className="size-4" /> Limpiar
            </Button>
          )}
          <RecordForm
            config={config}
            referenceOptions={referenceOptions}
            trigger={
              <Button>
                <Plus className="size-4" /> Nuevo {config.singular.toLowerCase()}
              </Button>
            }
          />
        </div>
      </div>

      {/* Table */}
      <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={cn(
                      "px-4",
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
                        ? "Ningún registro coincide con los filtros."
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
                        "px-4 py-3",
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
        <p className="text-sm text-muted-foreground">
          {filtered.toLocaleString("es-MX")} registro
          {filtered === 1 ? "" : "s"}
          {hasFilters ? " (filtrado)" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
            items={{ "10": "10 / página", "25": "25 / página", "50": "50 / página" }}
          >
            <SelectTrigger className="h-9 w-28">
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
          <span className="text-sm text-muted-foreground tabular-nums">
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
