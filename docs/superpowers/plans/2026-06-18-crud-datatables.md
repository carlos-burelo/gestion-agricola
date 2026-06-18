# Vistas CRUD vivas + datatables — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir las ~18 vistas CRUD planas en tablas "vivas" con tira de KPIs y superpoderes de datatable (orden, búsqueda global, filtros, paginación) usando TanStack Table.

**Architecture:** La tabla genérica sigue dirigida por `config.fields`. Se extraen renderers de celda a `record-cells.tsx`, se agrega `record-stats.tsx` (KPIs genéricos reusando `StatCard`), y se reescribe `record-table.tsx` sobre `@tanstack/react-table` (headless) con la `Table` shadcn. Sort/filtro/búsqueda/paginación 100% cliente sobre el array ya cargado.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, shadcn (base-ui), TanStack Table v8.

## Global Constraints

- No tocar dominio, servicios, PEPS ni datastore. Solo capa de presentación.
- Única dependencia nueva: `@tanstack/react-table`. Instalar con **pnpm** (`pnpm add`).
- Siempre usar **pnpm** (`pnpm exec`, `pnpm dlx`), nunca npx/npm.
- Moneda: `Intl.NumberFormat("es-MX", { currency: "MXN" })`. Tokens semánticos, no hex.
- **Entorno:** NO git, NO test runner (eslint no instalado). Verificación por tarea = `pnpm exec tsc --noEmit` sin errores nuevos + ruta CRUD carga 200 sin `__next_error__` en el dev server de :3000. Sin commits.
- Mutaciones siguen usando los server actions existentes (`deleteRecord`, `RecordForm`).

---

### Task 1: Dependencia + tonos de StatusBadge

**Files:**
- Modify: `package.json` (vía pnpm add)
- Modify: `src/presentation/components/status-badge.tsx`

**Interfaces:**
- Produces: `StatusBadge({ estado, tone }: { estado: string; tone?: string })` — `tone` (valor crudo) decide el color; `estado` es el texto mostrado.

- [ ] **Step 1: Instalar TanStack Table**

Run: `pnpm add @tanstack/react-table`
Expected: `@tanstack/react-table` en dependencies.

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 3: Extender StatusBadge (tone + más estados)**

Reemplazar `src/presentation/components/status-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TONE: Record<string, string> = {
  activo: "border-transparent bg-primary/15 text-primary",
  inactivo: "border-transparent bg-muted text-muted-foreground",
  planeado: "border-transparent bg-chart-3/15 text-chart-3",
  cosechado: "border-transparent bg-accent/20 text-accent-foreground",
  cerrado: "border-transparent bg-muted text-muted-foreground",
  pendiente: "border-transparent bg-accent/20 text-accent-foreground",
  pagada: "border-transparent bg-primary/15 text-primary",
  vencida: "border-transparent bg-destructive/15 text-destructive",
  borrador: "border-transparent bg-muted text-muted-foreground",
  autorizada: "border-transparent bg-chart-3/15 text-chart-3",
  parcial: "border-transparent bg-accent/20 text-accent-foreground",
  surtida: "border-transparent bg-primary/15 text-primary",
  cancelada: "border-transparent bg-destructive/15 text-destructive",
  cotizada: "border-transparent bg-chart-3/15 text-chart-3",
  comprada: "border-transparent bg-primary/15 text-primary",
  entrada: "border-transparent bg-primary/15 text-primary",
  salida: "border-transparent bg-accent/20 text-accent-foreground",
  true: "border-transparent bg-primary/15 text-primary",
  false: "border-transparent bg-muted text-muted-foreground",
}

export function StatusBadge({ estado, tone }: { estado: string; tone?: string }) {
  const key = (tone ?? estado).toLowerCase()
  return (
    <Badge variant="outline" className={cn("capitalize", TONE[key])}>
      {estado}
    </Badge>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores (kardex-view usa `StatusBadge estado={r.tipo}` → sigue válido).

- [ ] **Step 5: Checkpoint** — dep instalada, badge con tonos + `tone`.

---

### Task 2: Renderers de celda + tira de KPIs

**Files:**
- Create: `src/presentation/components/record-cells.tsx`
- Create: `src/presentation/components/record-stats.tsx`

**Interfaces:**
- Produces:
  - `cellText(field: FieldConfig, value: unknown, labelMap: Record<string,string>): string`
  - `CellContent({ field, value, labelMap, emphasize }): JSX` (badge/chip/money/date/text)
  - `RecordStats({ config, records, labelMap })`
- Consumes: `StatusBadge` (Task 1), `StatCard` (existe), `FieldConfig`/`ModuleConfig`.

- [ ] **Step 1: record-cells.tsx**

Create `src/presentation/components/record-cells.tsx`:

```tsx
import type { FieldConfig } from "@/presentation/config/modules"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"

const MONEY = ["costo", "importe", "precio", "valor"]
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function isMoney(name: string): boolean {
  const n = name.toLowerCase()
  return MONEY.some((k) => n.includes(k))
}

function formatDate(v: string): string {
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`
}

/** Plain-text value used for sorting and global search. */
export function cellText(
  field: FieldConfig,
  value: unknown,
  labelMap: Record<string, string>,
): string {
  if (value === undefined || value === null || value === "") return "—"
  if (field.type === "reference") return labelMap[String(value)] ?? String(value)
  if (field.type === "select") {
    const opt = field.options?.find((o) => o.value === String(value))
    return opt?.label ?? String(value)
  }
  if (field.name === "esSemillero")
    return value === "true" || value === true ? "Sí" : "No"
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (field.type === "number") {
    const n = Number(value)
    return isMoney(field.name)
      ? `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
      : n.toLocaleString("es-MX")
  }
  if (field.type === "date") return formatDate(String(value))
  return String(value)
}

/** Rich cell rendering: badges, chips, tabular money, emphasized primary. */
export function CellContent({
  field,
  value,
  labelMap,
  emphasize,
}: {
  field: FieldConfig
  value: unknown
  labelMap: Record<string, string>
  emphasize?: boolean
}) {
  const text = cellText(field, value, labelMap)
  if (text === "—") return <span className="text-muted-foreground">—</span>
  if (field.type === "select" || field.name === "esSemillero")
    return <StatusBadge estado={text} tone={String(value)} />
  if (field.type === "reference")
    return (
      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {text}
      </span>
    )
  if (field.type === "number")
    return <span className="tabular-nums">{text}</span>
  return (
    <span className={cn(emphasize && "font-medium text-foreground")}>{text}</span>
  )
}
```

- [ ] **Step 2: record-stats.tsx**

Create `src/presentation/components/record-stats.tsx`:

```tsx
import { Coins, Hash, ListChecks, Users } from "lucide-react"
import type { ModuleConfig } from "@/presentation/config/modules"
import { StatCard } from "./stat-card"

const MONEY = ["costo", "importe", "precio", "valor"]
const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)
const iconCls = "size-4 text-primary"

export function RecordStats({
  config,
  records,
}: {
  config: ModuleConfig
  records: Record<string, unknown>[]
}) {
  const cards: { label: string; value: string; icon: React.ReactNode }[] = [
    {
      label: `Total ${config.title.toLowerCase()}`,
      value: records.length.toLocaleString("es-MX"),
      icon: <ListChecks className={iconCls} />,
    },
  ]

  const moneyField = config.fields.find(
    (f) => f.type === "number" && MONEY.some((k) => f.name.toLowerCase().includes(k)),
  )
  if (moneyField) {
    const sum = records.reduce((a, r) => a + (Number(r[moneyField.name]) || 0), 0)
    cards.push({
      label: `${moneyField.label} total`,
      value: currency(sum),
      icon: <Coins className={iconCls} />,
    })
  }

  const estadoField = config.fields.find(
    (f) => f.type === "select" && f.name === "estado",
  )
  if (estadoField?.options?.length) {
    const first = estadoField.options[0]
    const n = records.filter((r) => String(r[estadoField.name]) === first.value).length
    cards.push({
      label: first.label,
      value: n.toLocaleString("es-MX"),
      icon: <Hash className={iconCls} />,
    })
  }

  const refField = config.fields.find((f) => f.type === "reference")
  if (refField) {
    const distinct = new Set(
      records.map((r) => String(r[refField.name])).filter((v) => v && v !== "undefined"),
    )
    cards.push({
      label: `${refField.label} distintos`,
      value: distinct.size.toLocaleString("es-MX"),
      icon: <Users className={iconCls} />,
    })
  }

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.slice(0, 4).map((c) => (
        <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />
      ))}
    </section>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Checkpoint** — renderers + KPIs listos.

---

### Task 3: Reescribir record-table.tsx sobre TanStack

**Files:**
- Modify: `src/presentation/components/record-table.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `CellContent`, `cellText` (Task 2); `RecordForm`, `deleteRecord`, `EmptyState`, shadcn `Table`/`Input`/`Select`/`Button`.
- Produces: `RecordTable({ config, records, referenceOptions, labelMap })` (firma sin cambios).

- [ ] **Step 1: Reemplazar el archivo**

Reemplazar `src/presentation/components/record-table.tsx`:

```tsx
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
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
              (columnFilters.find((c) => c.id === f.name)?.value as string) ?? ALL
            return (
              <Select
                key={f.name}
                value={current}
                onValueChange={(v) =>
                  table.getColumn(f.name)?.setFilterValue(v === ALL ? undefined : v)
                }
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
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={cn(h.column.id === "__actions" && "text-right")}
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
                      className={cn(cell.column.id === "__actions" && "text-right")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {filtered.toLocaleString("es-MX")} registro
          {filtered === 1 ? "" : "s"}
          {hasFilters ? " (filtrado)" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
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
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificar render**

Carga `http://localhost:3000/dashboard/movimientos` → 200; aparece búsqueda, filtro por Tipo, orden por columnas, badges de tipo (entrada/salida), montos alineados, paginación.

- [ ] **Step 4: Checkpoint** — datatable funcionando.

---

### Task 4: Insertar tira de KPIs en la página CRUD

**Files:**
- Modify: `src/app/dashboard/[slug]/page.tsx`

- [ ] **Step 1: Renderizar RecordStats**

En `src/app/dashboard/[slug]/page.tsx`, importar y renderizar antes de la tabla:

```tsx
import { RecordStats } from "@/presentation/components/record-stats"
```

Reemplazar el bloque de retorno:

```tsx
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        badge={config.group}
        title={config.title}
        description={config.description}
      />
      <RecordStats
        config={config}
        records={records as unknown as Record<string, unknown>[]}
      />
      <RecordTable
        config={config}
        records={records as unknown as Record<string, unknown>[]}
        referenceOptions={referenceOptions}
        labelMap={labelMap}
      />
    </div>
  )
```

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/ciclos` → 200; tira de 4 KPIs arriba de la tabla.

- [ ] **Step 3: Checkpoint** — KPIs integrados.

---

### Task 5: Verificación global

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 2: Recorrido de rutas CRUD**

Con el dev server en :3000, cargar y revisar (200 + sin `__next_error__`):
`/dashboard/ranchos`, `/dashboard/ciclos`, `/dashboard/movimientos`,
`/dashboard/ordenes-compra`, `/dashboard/cuentas-por-pagar`, `/dashboard/proveedores`,
`/dashboard/productos`.
Verificar a ojo: KPIs, búsqueda, filtro por estado/tipo, orden por columna, paginación, badges, chips de referencia, montos alineados.

- [ ] **Step 3: Verificar que análisis no se rompió**

Cargar `/dashboard`, `/dashboard/costeo`, `/dashboard/kardex` → 200 (no debieron cambiar).

- [ ] **Step 4: Checkpoint final** — CRUD vivas + datatables completo.

---

## Self-Review

- **Spec coverage:** dep TanStack (T1) ✓; tira KPIs reusa StatCard (T2+T4) ✓; filas vivas badges/chips/money/date (T2) ✓; orden/búsqueda/filtros/paginación (T3) ✓; StatusBadge tonos ampliados (T1) ✓; acciones editar/eliminar preservadas (T3 RowActions) ✓; dirigido por config (T3) ✓; sin tocar dominio/servicios (todas) ✓.
- **Placeholder scan:** sin TBD/TODO; código completo en cada step.
- **Type consistency:** `cellText`/`CellContent` definidos en T2 con la misma firma usada en T3; `RecordStats` props `{config, records}` coinciden T2↔T4 (labelMap no se usa en stats, se omitió del prop). `RecordTable` mantiene su firma original (T3) → `[slug]/page.tsx` (T4) la invoca igual.
