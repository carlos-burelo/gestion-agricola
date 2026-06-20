# Suite de reportes — Contabilidad (CxP) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hub de reportes con framework PDF reutilizable + 3 reportes contables (aging, estado de cuenta, egresos) + inventario migrado, cada uno con vista en pantalla y descarga PDF.

**Architecture:** Helpers contables puros (`lib/accounting.ts`) usados en cliente; un shell PDF reutilizable; vistas HTML y documentos PDF por reporte; un hub cliente con filtros que computa y descarga. Datos crudos cargados en el server, cómputo en cliente.

**Tech Stack:** Next.js 16, React 19, @react-pdf/renderer (lazy), shadcn (base-ui).

## Global Constraints

- pnpm siempre. @react-pdf por import dinámico (lazy). Sin servidor, sin API keys.
- Moneda `Intl.NumberFormat("es-MX", { currency: "MXN" })`. Marca "Gestión agrícola".
- No tocar dominio/PEPS/datastore core.
- **Entorno:** NO git, NO test runner. Verificación por tarea = `pnpm exec tsc --noEmit` 0 + ruta 200 sin `__next_error__`. Sin commits. Si tras instalar deps tsc reporta "Cannot find namespace" raro, borrar `tsconfig.tsbuildinfo`.

---

### Task 1: Helpers contables puros + query

**Files:**
- Create: `src/lib/accounting.ts`
- Create: `src/presentation/reports-queries.ts`

**Interfaces:**
- Produces (accounting.ts):
  - `CxP` = `CuentaPorPagar` (re-export tipo de entidades)
  - `ProveedorRef = { id: string; razonSocial: string }`
  - `AgingFila = { proveedor: string; porVencer: number; d1_30: number; d31_60: number; d61_90: number; d90: number; total: number }`
  - `AgingReporte = { filas: AgingFila[]; totales: AgingFila }`
  - `EstadoCuentaReporte = { proveedor: string; filas: { factura: string; fecha: string; vencimiento: string; importe: number; estado: string }[]; totales: { facturado: number; pagado: number; pendiente: number; vencido: number } }`
  - `EgresoMes = { mes: string; pagado: number; pendiente: number; total: number }`
  - `aging(cxps, proveedores, hoy): AgingReporte`
  - `estadoCuenta(cxps, proveedores, proveedorId): EstadoCuentaReporte`
  - `egresosPorMes(cxps): EgresoMes[]`
  - `filtrarPorFecha(cxps, desde?, hasta?): CuentaPorPagar[]`
- Produces (reports-queries.ts): `loadReportesContext(): Promise<{ cxps: CuentaPorPagar[]; proveedores: ProveedorRef[]; inventario: InventarioFila[] }>` con `InventarioFila = { producto: string; existencia: number; costoPromedio: number; valorInventario: number }`.

- [ ] **Step 1: accounting.ts**

Create `src/lib/accounting.ts`:

```ts
import type { CuentaPorPagar } from "@/core/domain/entities"

export type CxP = CuentaPorPagar
export interface ProveedorRef {
  id: string
  razonSocial: string
}

export interface AgingFila {
  proveedor: string
  porVencer: number
  d1_30: number
  d31_60: number
  d61_90: number
  d90: number
  total: number
}
export interface AgingReporte {
  filas: AgingFila[]
  totales: AgingFila
}

export interface EstadoCuentaReporte {
  proveedor: string
  filas: {
    factura: string
    fecha: string
    vencimiento: string
    importe: number
    estado: string
  }[]
  totales: { facturado: number; pagado: number; pendiente: number; vencido: number }
}

export interface EgresoMes {
  mes: string
  pagado: number
  pendiente: number
  total: number
}

function diasVencido(fechaVencimiento: string, hoy: Date): number {
  const v = new Date(`${fechaVencimiento}T00:00:00Z`)
  const h = new Date(
    `${hoy.toISOString().slice(0, 10)}T00:00:00Z`,
  )
  return Math.floor((h.getTime() - v.getTime()) / 86_400_000)
}

const emptyFila = (proveedor: string): AgingFila => ({
  proveedor,
  porVencer: 0,
  d1_30: 0,
  d31_60: 0,
  d61_90: 0,
  d90: 0,
  total: 0,
})

/** Aging buckets over UNPAID accounts, grouped by supplier. */
export function aging(
  cxps: CuentaPorPagar[],
  proveedores: ProveedorRef[],
  hoy: Date,
): AgingReporte {
  const nombre = new Map(proveedores.map((p) => [p.id, p.razonSocial]))
  const map = new Map<string, AgingFila>()
  const totales = emptyFila("Total")

  for (const c of cxps) {
    if (c.estado === "pagada") continue
    const key = c.proveedorId
    let fila = map.get(key)
    if (!fila) {
      fila = emptyFila(nombre.get(key) ?? key)
      map.set(key, fila)
    }
    const d = diasVencido(c.fechaVencimiento, hoy)
    let bucket: keyof AgingFila
    if (d <= 0) bucket = "porVencer"
    else if (d <= 30) bucket = "d1_30"
    else if (d <= 60) bucket = "d31_60"
    else if (d <= 90) bucket = "d61_90"
    else bucket = "d90"
    fila[bucket] += c.importe
    fila.total += c.importe
    totales[bucket] += c.importe
    totales.total += c.importe
  }

  const filas = Array.from(map.values()).sort((a, b) => b.total - a.total)
  return { filas, totales }
}

/** Per-supplier statement with totals split by status. */
export function estadoCuenta(
  cxps: CuentaPorPagar[],
  proveedores: ProveedorRef[],
  proveedorId: string,
): EstadoCuentaReporte {
  const nombre = new Map(proveedores.map((p) => [p.id, p.razonSocial]))
  const rows = cxps
    .filter((c) => c.proveedorId === proveedorId)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
  const totales = { facturado: 0, pagado: 0, pendiente: 0, vencido: 0 }
  const filas = rows.map((c) => {
    totales.facturado += c.importe
    if (c.estado === "pagada") totales.pagado += c.importe
    else if (c.estado === "vencida") totales.vencido += c.importe
    else totales.pendiente += c.importe
    return {
      factura: c.factura,
      fecha: c.createdAt.slice(0, 10),
      vencimiento: c.fechaVencimiento,
      importe: c.importe,
      estado: c.estado,
    }
  })
  return { proveedor: nombre.get(proveedorId) ?? proveedorId, filas, totales }
}

/** Outflows grouped by the month the account was generated (createdAt). */
export function egresosPorMes(cxps: CuentaPorPagar[]): EgresoMes[] {
  const map = new Map<string, EgresoMes>()
  for (const c of cxps) {
    const mes = c.createdAt.slice(0, 7)
    let e = map.get(mes)
    if (!e) {
      e = { mes, pagado: 0, pendiente: 0, total: 0 }
      map.set(mes, e)
    }
    if (c.estado === "pagada") e.pagado += c.importe
    else e.pendiente += c.importe
    e.total += c.importe
  }
  return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes))
}

/** Filters by createdAt date (inclusive, "YYYY-MM-DD"). */
export function filtrarPorFecha(
  cxps: CuentaPorPagar[],
  desde?: string,
  hasta?: string,
): CuentaPorPagar[] {
  return cxps.filter((c) => {
    const d = c.createdAt.slice(0, 10)
    if (desde && d < desde) return false
    if (hasta && d > hasta) return false
    return true
  })
}
```

- [ ] **Step 2: reports-queries.ts**

Create `src/presentation/reports-queries.ts`:

```ts
import "server-only"
import type { CuentaPorPagar, Producto } from "@/core/domain/entities"
import { inventoryService, repository } from "@/infrastructure/container"
import type { ProveedorRef } from "@/lib/accounting"

export interface InventarioFila {
  producto: string
  existencia: number
  costoPromedio: number
  valorInventario: number
}

export interface ReportesContext {
  cxps: CuentaPorPagar[]
  proveedores: ProveedorRef[]
  inventario: InventarioFila[]
}

export async function loadReportesContext(): Promise<ReportesContext> {
  const [cxps, proveedores, existencias] = await Promise.all([
    repository<CuentaPorPagar>("cuentasPorPagar").findAll(),
    repository<{ id: string; razonSocial: string }>("proveedores").findAll(),
    inventoryService().existencias(),
  ])
  return {
    cxps,
    proveedores: proveedores.map((p) => ({
      id: p.id,
      razonSocial: p.razonSocial,
    })),
    inventario: existencias.map((e) => ({
      producto: e.producto.nombreComercial,
      existencia: e.existencia,
      costoPromedio: e.costoPromedio,
      valorInventario: e.valorInventario,
    })),
  }
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Checkpoint** — lógica contable + query listas.

---

### Task 2: Framework PDF (report-shell) + util de moneda

**Files:**
- Create: `src/presentation/components/reports/report-shell.tsx`

**Interfaces:**
- Produces:
  - `mxn(n: number): string`
  - `Logo()` (Svg piña)
  - `ReportDocument({ titulo, subtitulo, generadoEl, filtros?, children })`
  - `ReportKpis({ items: { label: string; value: string }[] })`
  - `ReportSection({ titulo, children })`
  - `ReportTable({ columns, rows, total? })` con
    `Col = { key: string; label: string; align?: "left" | "right"; width?: number }`,
    `rows: Record<string, string | number>[]`,
    `total?: Record<string, string | number>`

- [ ] **Step 1: Crear el shell**

Create `src/presentation/components/reports/report-shell.tsx`:

```tsx
import {
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  type Style,
} from "@react-pdf/renderer"
import type { ReactNode } from "react"

export const mxn = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(n)

const GREEN = "#2C8B55"
const GOLD = "#E0982A"
const INK = "#1f2937"
const MUTED = "#6b7280"
const LINE = "#e5e7eb"

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    paddingBottom: 12,
    marginBottom: 14,
  },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold", color: GREEN },
  titulo: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 9, color: MUTED },
  headerRight: { marginLeft: "auto", textAlign: "right" },
  filtros: { fontSize: 8, color: MUTED, marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 10,
  },
  kpis: { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpi: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 8 },
  kpiLabel: { fontSize: 8, color: MUTED, marginBottom: 3 },
  kpiValue: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  tHead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  tTotal: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: INK,
  },
  th: { fontSize: 9, fontFamily: "Helvetica-Bold", color: MUTED },
  cell: { fontSize: 9 },
  bold: { fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
  },
})

export function Logo() {
  return (
    <Svg width={32} height={32} viewBox="0 0 180 180">
      <Path
        d="M0 40C0 18 18 0 40 0H140C162 0 180 18 180 40V140C180 162 162 180 140 180H40C18 180 0 162 0 140Z"
        fill="#16341F"
      />
      <Path
        d="M90 70C118 70 134 90 134 113C134 139 113 156 90 156C67 156 46 139 46 113C46 90 62 70 90 70Z"
        fill={GOLD}
        stroke="#B9781F"
        strokeWidth={3}
      />
      <Path d="M78 84C58 70 46 62 42 48C58 56 80 66 78 84Z" fill={GREEN} />
      <Path d="M102 84C122 70 134 62 138 48C122 56 100 66 102 84Z" fill={GREEN} />
      <Path d="M90 82C82 56 86 42 90 24C94 42 98 56 90 82Z" fill="#5BC676" />
      <Path d="M84 82C70 60 64 50 64 34C76 46 90 60 84 82Z" fill={GREEN} />
      <Path d="M96 82C110 60 116 50 116 34C104 46 90 60 96 82Z" fill={GREEN} />
    </Svg>
  )
}

export function ReportDocument({
  titulo,
  subtitulo,
  generadoEl,
  filtros,
  children,
}: {
  titulo: string
  subtitulo?: string
  generadoEl: string
  filtros?: string
  children: ReactNode
}) {
  return (
    <Document title={titulo} author="Gestión agrícola">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Logo />
          <View>
            <Text style={s.brand}>Gestión agrícola</Text>
            <Text style={s.titulo}>{titulo}</Text>
            {subtitulo ? <Text style={s.sub}>{subtitulo}</Text> : null}
          </View>
          <View style={s.headerRight}>
            <Text style={s.sub}>Generado</Text>
            <Text style={s.bold}>{generadoEl}</Text>
          </View>
        </View>
        {filtros ? <Text style={s.filtros}>{filtros}</Text> : null}
        {children}
        <View style={s.footer} fixed>
          <Text>Gestión agrícola · Sistema de gestión agrícola</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}

export function ReportSection({
  titulo,
  children,
}: {
  titulo: string
  children: ReactNode
}) {
  return (
    <View>
      <Text style={s.sectionTitle}>{titulo}</Text>
      {children}
    </View>
  )
}

export function ReportKpis({
  items,
}: {
  items: { label: string; value: string }[]
}) {
  return (
    <View style={s.kpis}>
      {items.map((it, i) => (
        <View key={i} style={s.kpi}>
          <Text style={s.kpiLabel}>{it.label}</Text>
          <Text style={s.kpiValue}>{it.value}</Text>
        </View>
      ))}
    </View>
  )
}

export interface Col {
  key: string
  label: string
  align?: "left" | "right"
  width?: number
}

function cellStyle(col: Col): Style {
  const base: Style = col.width
    ? { width: col.width }
    : { flex: 1 }
  if (col.align === "right") base.textAlign = "right"
  return base
}

export function ReportTable({
  columns,
  rows,
  total,
}: {
  columns: Col[]
  rows: Record<string, string | number>[]
  total?: Record<string, string | number>
}) {
  return (
    <View>
      <View style={s.tHead}>
        {columns.map((c) => (
          <Text key={c.key} style={[s.th, cellStyle(c)]}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.tRow} wrap={false}>
          {columns.map((c) => (
            <Text key={c.key} style={[s.cell, cellStyle(c)]}>
              {r[c.key] ?? ""}
            </Text>
          ))}
        </View>
      ))}
      {total ? (
        <View style={s.tTotal}>
          {columns.map((c) => (
            <Text key={c.key} style={[s.cell, s.bold, cellStyle(c)]}>
              {total[c.key] ?? ""}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores. (Si `type Style` no se exporta de @react-pdf/renderer, usar `import type { Styles } from "@react-pdf/renderer"` o tipar `cellStyle` como `Record<string, unknown>`; confirmar leyendo `node_modules/@react-pdf/renderer/index.d.ts`.)

- [ ] **Step 3: Checkpoint** — framework PDF listo.

---

### Task 3: Documentos PDF (4) sobre el shell

**Files:**
- Create: `src/presentation/components/reports/report-doc-inventario.tsx`
- Create: `src/presentation/components/reports/report-doc-aging.tsx`
- Create: `src/presentation/components/reports/report-doc-estado-cuenta.tsx`
- Create: `src/presentation/components/reports/report-doc-egresos.tsx`

**Interfaces:**
- Consumes: `ReportDocument`, `ReportKpis`, `ReportTable`, `ReportSection`, `mxn` (Task 2); tipos de `lib/accounting` (Task 1); `InventarioFila` (Task 1).
- Produces: `InventarioDoc({ generadoEl, inventario })`, `AgingDoc({ generadoEl, filtros, data })`, `EstadoCuentaDoc({ generadoEl, filtros, data })`, `EgresosDoc({ generadoEl, filtros, data })`.

- [ ] **Step 1: Inventario**

Create `src/presentation/components/reports/report-doc-inventario.tsx`:

```tsx
import type { InventarioFila } from "@/presentation/reports-queries"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function InventarioDoc({
  generadoEl,
  inventario,
}: {
  generadoEl: string
  inventario: InventarioFila[]
}) {
  const valorTotal = inventario.reduce((a, f) => a + f.valorInventario, 0)
  const unidades = inventario.reduce((a, f) => a + f.existencia, 0)
  return (
    <ReportDocument
      titulo="Inventario valorizado (PEPS)"
      generadoEl={generadoEl}
    >
      <ReportKpis
        items={[
          { label: "Valor total en almacén", value: mxn(valorTotal) },
          { label: "Productos", value: inventario.length.toLocaleString("es-MX") },
          { label: "Unidades", value: unidades.toLocaleString("es-MX") },
        ]}
      />
      <ReportTable
        columns={[
          { key: "producto", label: "Producto" },
          { key: "existencia", label: "Existencia", align: "right", width: 80 },
          { key: "costo", label: "Costo prom.", align: "right", width: 90 },
          { key: "valor", label: "Valor", align: "right", width: 90 },
        ]}
        rows={inventario.map((f) => ({
          producto: f.producto,
          existencia: f.existencia.toLocaleString("es-MX"),
          costo: mxn(f.costoPromedio),
          valor: mxn(f.valorInventario),
        }))}
        total={{ producto: "Total", valor: mxn(valorTotal) }}
      />
    </ReportDocument>
  )
}
```

- [ ] **Step 2: Aging**

Create `src/presentation/components/reports/report-doc-aging.tsx`:

```tsx
import type { AgingReporte } from "@/lib/accounting"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function AgingDoc({
  generadoEl,
  filtros,
  data,
}: {
  generadoEl: string
  filtros?: string
  data: AgingReporte
}) {
  const t = data.totales
  return (
    <ReportDocument
      titulo="Antigüedad de saldos (cuentas por pagar)"
      subtitulo="Saldos no pagados por días de vencimiento"
      generadoEl={generadoEl}
      filtros={filtros}
    >
      <ReportKpis
        items={[
          { label: "Saldo total", value: mxn(t.total) },
          { label: "Por vencer", value: mxn(t.porVencer) },
          { label: "Vencido +90 días", value: mxn(t.d90) },
        ]}
      />
      <ReportTable
        columns={[
          { key: "proveedor", label: "Proveedor" },
          { key: "porVencer", label: "Por vencer", align: "right", width: 66 },
          { key: "d1_30", label: "1–30", align: "right", width: 56 },
          { key: "d31_60", label: "31–60", align: "right", width: 56 },
          { key: "d61_90", label: "61–90", align: "right", width: 56 },
          { key: "d90", label: "+90", align: "right", width: 56 },
          { key: "total", label: "Total", align: "right", width: 70 },
        ]}
        rows={data.filas.map((f) => ({
          proveedor: f.proveedor,
          porVencer: mxn(f.porVencer),
          d1_30: mxn(f.d1_30),
          d31_60: mxn(f.d31_60),
          d61_90: mxn(f.d61_90),
          d90: mxn(f.d90),
          total: mxn(f.total),
        }))}
        total={{
          proveedor: "Total",
          porVencer: mxn(t.porVencer),
          d1_30: mxn(t.d1_30),
          d31_60: mxn(t.d31_60),
          d61_90: mxn(t.d61_90),
          d90: mxn(t.d90),
          total: mxn(t.total),
        }}
      />
    </ReportDocument>
  )
}
```

- [ ] **Step 3: Estado de cuenta**

Create `src/presentation/components/reports/report-doc-estado-cuenta.tsx`:

```tsx
import type { EstadoCuentaReporte } from "@/lib/accounting"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function EstadoCuentaDoc({
  generadoEl,
  filtros,
  data,
}: {
  generadoEl: string
  filtros?: string
  data: EstadoCuentaReporte
}) {
  const t = data.totales
  return (
    <ReportDocument
      titulo="Estado de cuenta por proveedor"
      subtitulo={data.proveedor}
      generadoEl={generadoEl}
      filtros={filtros}
    >
      <ReportKpis
        items={[
          { label: "Facturado", value: mxn(t.facturado) },
          { label: "Pagado", value: mxn(t.pagado) },
          { label: "Pendiente + vencido", value: mxn(t.pendiente + t.vencido) },
        ]}
      />
      <ReportTable
        columns={[
          { key: "factura", label: "Factura", width: 90 },
          { key: "fecha", label: "Fecha", width: 70 },
          { key: "vencimiento", label: "Vence", width: 70 },
          { key: "estado", label: "Estado", width: 70 },
          { key: "importe", label: "Importe", align: "right" },
        ]}
        rows={data.filas.map((f) => ({
          factura: f.factura || "—",
          fecha: f.fecha,
          vencimiento: f.vencimiento,
          estado: f.estado,
          importe: mxn(f.importe),
        }))}
        total={{ factura: "Total", importe: mxn(t.facturado) }}
      />
    </ReportDocument>
  )
}
```

- [ ] **Step 4: Egresos**

Create `src/presentation/components/reports/report-doc-egresos.tsx`:

```tsx
import type { EgresoMes } from "@/lib/accounting"
import { ReportDocument, ReportKpis, ReportTable, mxn } from "./report-shell"

export function EgresosDoc({
  generadoEl,
  filtros,
  data,
}: {
  generadoEl: string
  filtros?: string
  data: EgresoMes[]
}) {
  const total = data.reduce((a, e) => a + e.total, 0)
  const pagado = data.reduce((a, e) => a + e.pagado, 0)
  return (
    <ReportDocument
      titulo="Egresos por periodo (cuentas por pagar)"
      generadoEl={generadoEl}
      filtros={filtros}
    >
      <ReportKpis
        items={[
          { label: "Total", value: mxn(total) },
          { label: "Pagado", value: mxn(pagado) },
          { label: "Pendiente", value: mxn(total - pagado) },
        ]}
      />
      <ReportTable
        columns={[
          { key: "mes", label: "Mes" },
          { key: "pagado", label: "Pagado", align: "right", width: 100 },
          { key: "pendiente", label: "Pendiente", align: "right", width: 100 },
          { key: "total", label: "Total", align: "right", width: 100 },
        ]}
        rows={data.map((e) => ({
          mes: e.mes,
          pagado: mxn(e.pagado),
          pendiente: mxn(e.pendiente),
          total: mxn(e.total),
        }))}
        total={{
          mes: "Total",
          pagado: mxn(pagado),
          pendiente: mxn(total - pagado),
          total: mxn(total),
        }}
      />
    </ReportDocument>
  )
}
```

- [ ] **Step 5: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Checkpoint** — 4 documentos PDF listos.

---

### Task 4: Vistas HTML por reporte

**Files:**
- Create: `src/presentation/components/reports/inventario-view.tsx`
- Create: `src/presentation/components/reports/aging-view.tsx`
- Create: `src/presentation/components/reports/estado-cuenta-view.tsx`
- Create: `src/presentation/components/reports/egresos-view.tsx`

**Interfaces:**
- Consumes: tipos de `lib/accounting`, `InventarioFila`; shadcn `Table`, `Card`, `StatCard`, `StatusBadge`.
- Produces: `InventarioView({ inventario })`, `AgingView({ data })`, `EstadoCuentaView({ data })`, `EgresosView({ data })`.

- [ ] **Step 1: Helper de moneda compartido en vistas**

Cada vista declara `const currency = (n:number)=> new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n)` y usa `Table`/`Card` de shadcn con `tabular-nums` en columnas numéricas y `StatusBadge` para estados.

- [ ] **Step 2: aging-view.tsx**

Create `src/presentation/components/reports/aging-view.tsx`:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AgingReporte } from "@/lib/accounting"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function AgingView({ data }: { data: AgingReporte }) {
  const cols = [
    ["porVencer", "Por vencer"],
    ["d1_30", "1–30"],
    ["d31_60", "31–60"],
    ["d61_90", "61–90"],
    ["d90", "+90"],
    ["total", "Total"],
  ] as const
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proveedor</TableHead>
            {cols.map(([k, l]) => (
              <TableHead key={k} className="text-right">
                {l}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.filas.map((f) => (
            <TableRow key={f.proveedor}>
              <TableCell className="font-medium">{f.proveedor}</TableCell>
              {cols.map(([k]) => (
                <TableCell key={k} className="text-right tabular-nums">
                  {currency(f[k])}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            {cols.map(([k]) => (
              <TableCell key={k} className="text-right tabular-nums">
                {currency(data.totales[k])}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 3: estado-cuenta-view.tsx**

Create `src/presentation/components/reports/estado-cuenta-view.tsx`:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EstadoCuentaReporte } from "@/lib/accounting"
import { StatusBadge } from "@/presentation/components/status-badge"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function EstadoCuentaView({ data }: { data: EstadoCuentaReporte }) {
  const t = data.totales
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Facturado", t.facturado],
          ["Pagado", t.pagado],
          ["Pendiente", t.pendiente],
          ["Vencido", t.vencido],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-lg font-semibold tabular-nums">
              {currency(v as number)}
            </p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Importe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.filas.map((f, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{f.factura || "—"}</TableCell>
                <TableCell>{f.fecha}</TableCell>
                <TableCell>{f.vencimiento}</TableCell>
                <TableCell>
                  <StatusBadge estado={f.estado} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency(f.importe)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: egresos-view.tsx**

Create `src/presentation/components/reports/egresos-view.tsx`:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EgresoMes } from "@/lib/accounting"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function EgresosView({ data }: { data: EgresoMes[] }) {
  const total = data.reduce((a, e) => a + e.total, 0)
  const pagado = data.reduce((a, e) => a + e.pagado, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mes</TableHead>
            <TableHead className="text-right">Pagado</TableHead>
            <TableHead className="text-right">Pendiente</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((e) => (
            <TableRow key={e.mes}>
              <TableCell className="font-medium">{e.mes}</TableCell>
              <TableCell className="text-right tabular-nums">
                {currency(e.pagado)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {currency(e.pendiente)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {currency(e.total)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(pagado)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(total - pagado)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {currency(total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 5: inventario-view.tsx**

Create `src/presentation/components/reports/inventario-view.tsx`:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { InventarioFila } from "@/presentation/reports-queries"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function InventarioView({
  inventario,
}: {
  inventario: InventarioFila[]
}) {
  const total = inventario.reduce((a, f) => a + f.valorInventario, 0)
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Existencia</TableHead>
            <TableHead className="text-right">Costo prom.</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventario.map((f, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{f.producto}</TableCell>
              <TableCell className="text-right tabular-nums">
                {f.existencia.toLocaleString("es-MX")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {currency(f.costoPromedio)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {currency(f.valorInventario)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-foreground/30 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell />
            <TableCell />
            <TableCell className="text-right tabular-nums">
              {currency(total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 6: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Checkpoint** — vistas HTML listas.

---

### Task 5: Hub interactivo + página + limpieza

**Files:**
- Create: `src/presentation/components/reports/reportes-hub.tsx`
- Modify: `src/app/dashboard/reportes/page.tsx` (rehecho)
- Delete: `src/presentation/components/report-pdf.tsx`, `src/presentation/components/download-report-button.tsx`

**Interfaces:**
- Consumes: `ReportesContext` (Task 1), vistas (Task 4), docs (Task 3), `lib/accounting`, shadcn `Card`/`Select`/`Input`/`Button`, `toast`.
- Produces: `ReportesHub({ ctx }: { ctx: ReportesContext })`.

- [ ] **Step 1: Hub cliente**

Create `src/presentation/components/reports/reportes-hub.tsx`:

```tsx
"use client"

import { Boxes, CalendarClock, FileDown, FileText, Receipt } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  aging,
  egresosPorMes,
  estadoCuenta,
  filtrarPorFecha,
} from "@/lib/accounting"
import type { ReportesContext } from "@/presentation/reports-queries"
import { AgingView } from "./aging-view"
import { EgresosView } from "./egresos-view"
import { EstadoCuentaView } from "./estado-cuenta-view"
import { InventarioView } from "./inventario-view"

type ReportId = "aging" | "estado" | "egresos" | "inventario"

const CATALOGO: {
  id: ReportId
  titulo: string
  descripcion: string
  icon: typeof FileText
}[] = [
  { id: "aging", titulo: "Antigüedad de saldos", descripcion: "Cuentas por pagar por días de vencimiento.", icon: CalendarClock },
  { id: "estado", titulo: "Estado de cuenta", descripcion: "Movimientos y saldo por proveedor.", icon: FileText },
  { id: "egresos", titulo: "Egresos por periodo", descripcion: "Cuentas por pagar por mes.", icon: Receipt },
  { id: "inventario", titulo: "Inventario valorizado", descripcion: "Existencias y valor PEPS.", icon: Boxes },
]

const hoyStr = () => new Date().toISOString().slice(0, 10)

export function ReportesHub({ ctx }: { ctx: ReportesContext }) {
  const [sel, setSel] = useState<ReportId>("aging")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [proveedorId, setProveedorId] = useState(ctx.proveedores[0]?.id ?? "")
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

  const rango =
    desde || hasta ? `Periodo: ${desde || "inicio"} a ${hasta || "hoy"}` : undefined

  async function descargar() {
    setBusy(true)
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const generadoEl = hoyStr()
      let doc: React.ReactElement
      let nombre: string
      if (sel === "aging") {
        const { AgingDoc } = await import("./report-doc-aging")
        doc = <AgingDoc generadoEl={generadoEl} filtros={rango} data={agingData} />
        nombre = "Antiguedad-saldos"
      } else if (sel === "estado") {
        const { EstadoCuentaDoc } = await import("./report-doc-estado-cuenta")
        doc = (
          <EstadoCuentaDoc generadoEl={generadoEl} filtros={rango} data={estadoData} />
        )
        nombre = `Estado-cuenta-${estadoData.proveedor.replace(/\s+/g, "_")}`
      } else if (sel === "egresos") {
        const { EgresosDoc } = await import("./report-doc-egresos")
        doc = <EgresosDoc generadoEl={generadoEl} filtros={rango} data={egresosData} />
        nombre = "Egresos-por-periodo"
      } else {
        const { InventarioDoc } = await import("./report-doc-inventario")
        doc = <InventarioDoc generadoEl={generadoEl} inventario={ctx.inventario} />
        nombre = "Inventario-valorizado"
      }
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${nombre}-${generadoEl}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("PDF generado")
    } catch {
      toast.error("No se pudo generar el PDF")
    } finally {
      setBusy(false)
    }
  }

  const usaProveedor = sel === "estado"

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Catálogo */}
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

      {/* Panel */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9" />
          </div>
          {usaProveedor && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Proveedor</Label>
              <Select
                value={proveedorId}
                onValueChange={(v) => v && setProveedorId(v)}
                items={Object.fromEntries(
                  ctx.proveedores.map((p) => [p.id, p.razonSocial]),
                )}
              >
                <SelectTrigger className="h-9 min-w-48">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {ctx.proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={descargar} disabled={busy} variant="outline" className="ml-auto">
            <FileDown className="size-4" />
            {busy ? "Generando…" : "Descargar PDF"}
          </Button>
        </div>

        {sel === "aging" && <AgingView data={agingData} />}
        {sel === "estado" && <EstadoCuentaView data={estadoData} />}
        {sel === "egresos" && <EgresosView data={egresosData} />}
        {sel === "inventario" && <InventarioView inventario={ctx.inventario} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Página del hub**

Reemplazar `src/app/dashboard/reportes/page.tsx`:

```tsx
import { PageHeader } from "@/presentation/components/page-header"
import { ReportesHub } from "@/presentation/components/reports/reportes-hub"
import { loadReportesContext } from "@/presentation/reports-queries"

export default async function ReportesPage() {
  const ctx = await loadReportesContext()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        badge="Análisis"
        title="Reportes"
        description="Contabilidad de cuentas por pagar e inventario. Filtra y descarga en PDF."
      />
      <ReportesHub ctx={ctx} />
    </div>
  )
}
```

- [ ] **Step 3: Eliminar los archivos viejos del PDF de inventario**

Run: `rm src/presentation/components/report-pdf.tsx src/presentation/components/download-report-button.tsx`
(Si Windows: `Remove-Item` de ambos.) Confirmar que nada más los importa (`grep -r "report-pdf\|download-report-button" src` → 0 resultados tras el cambio de página).

- [ ] **Step 4: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/reportes` → 200; catálogo de 4 reportes, filtros, vista en pantalla.

- [ ] **Step 5: Checkpoint** — hub funcionando.

---

### Task 6: Verificación global

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 2: Rutas**

Cargar (200 + sin `__next_error__`): `/dashboard/reportes`, `/dashboard`, `/dashboard/mapa`, `/dashboard/costeo`, `/dashboard/cuentas-por-pagar`.

- [ ] **Step 3: Revisión a ojo en /dashboard/reportes**

Cada reporte (aging, estado de cuenta con selección de proveedor, egresos, inventario): vista HTML correcta, filtros de fecha re-calculan, "Descargar PDF" baja el PDF branded correspondiente. Verificar que aging cuadra (suma buckets = total) y estado de cuenta cuadra (facturado = pagado + pendiente + vencido).

- [ ] **Step 4: Checkpoint final** — suite de contabilidad completa.

---

## Self-Review

- **Spec coverage:** helpers puros aging/estado/egresos/filtro (T1) ✓; framework shell + KPIs/Table/Section + logo (T2) ✓; 4 docs PDF (T3) ✓; 4 vistas HTML (T4) ✓; hub catálogo + filtros + preview + descarga lazy (T5) ✓; inventario migrado al framework (T3/T4) ✓; limpieza de archivos viejos (T5) ✓; supuestos contables aplicados (T1) ✓; verificación (T6) ✓.
- **Placeholder scan:** sin TBD/TODO; código completo. Único punto a confirmar contra el paquete: el tipo `Style` de @react-pdf (T2 step 2 indica el fallback).
- **Type consistency:** `AgingReporte`/`EstadoCuentaReporte`/`EgresoMes`/`InventarioFila`/`ReportesContext`/`ProveedorRef` definidos en T1 y consumidos idénticos en T3/T4/T5; firmas de docs `({ generadoEl, filtros?, data })` consistentes T3↔T5; `ReportDocument`/`ReportTable`/`ReportKpis` firmas consistentes T2↔T3.
```
