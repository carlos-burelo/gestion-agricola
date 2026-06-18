# Rediseño estético premium — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar la UI de AgroPiña a nivel premium con gráficas (Recharts/shadcn) y componentes pulidos, sin tocar la lógica de negocio.

**Architecture:** Capa de presentación únicamente. Server components cargan datos vía services (capa application); se agrega un `AnalyticsService` para agregaciones temporales. Componentes cliente de gráficas reciben props serializables. Se añaden primitivos reutilizables que también elevan las páginas CRUD.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4, TypeScript, shadcn (`base-nova`), Recharts.

## Global Constraints

- No tocar `core/domain`, reglas PEPS, `infrastructure/persistence` ni `.data/database.json`.
- Única dependencia nueva permitida: `recharts` (vía `shadcn add chart`).
- Idioma de UI: español (es-MX). Moneda con `Intl.NumberFormat("es-MX", { currency: "MXN" })`.
- Tokens de color: usar variables CSS existentes (`--primary`, `--chart-1..5`, etc.). No hardcodear hex.
- **Entorno:** NO es repo git y NO hay test runner. Verificación por tarea = `npx tsc --noEmit` sin errores + la ruta afectada carga 200 en el dev server (`pnpm dev` ya corre en :3000). Sin `git commit`. Un "Checkpoint" reemplaza al commit.
- Server components por defecto; añadir `"use client"` solo a componentes con Recharts/estado/hooks.

---

### Task 1: Dependencias, primitivo de gráficas y tokens de tema

**Files:**
- Create: `src/components/ui/chart.tsx` (generado por shadcn CLI)
- Modify: `package.json` (recharts añadido por CLI)
- Modify: `src/app/globals.css` (rebrand modo oscuro + utilidades)

**Interfaces:**
- Produces: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, type `ChartConfig` desde `@/components/ui/chart`.

- [ ] **Step 1: Instalar primitivo chart + recharts**

Run: `npx shadcn@latest add chart`
Expected: crea `src/components/ui/chart.tsx` y añade `recharts` a `package.json`. Si pregunta por sobrescritura, no sobreescribir otros componentes.

Si el CLI falla por el estilo `base-nova`, alternativa manual:
Run: `pnpm add recharts` y copiar `chart.tsx` desde https://ui.shadcn.com/docs/components/chart (bloque "chart.tsx").

- [ ] **Step 2: Verificar instalación**

Run: `npx tsc --noEmit`
Expected: sin errores. `recharts` aparece en `package.json` dependencies.

- [ ] **Step 3: Rebrandear modo oscuro y añadir utilidades en globals.css**

En `src/app/globals.css`, reemplazar el bloque `.dark { ... }` (líneas ~87-120) por una paleta con marca verde:

```css
.dark {
  color-scheme: dark;
  --background: oklch(0.18 0.02 150);
  --foreground: oklch(0.96 0.01 140);
  --card: oklch(0.22 0.02 150);
  --card-foreground: oklch(0.96 0.01 140);
  --popover: oklch(0.22 0.02 150);
  --popover-foreground: oklch(0.96 0.01 140);
  --primary: oklch(0.7 0.15 150);
  --primary-foreground: oklch(0.16 0.03 150);
  --secondary: oklch(0.28 0.03 150);
  --secondary-foreground: oklch(0.96 0.01 140);
  --muted: oklch(0.26 0.02 150);
  --muted-foreground: oklch(0.72 0.02 145);
  --accent: oklch(0.83 0.13 80);
  --accent-foreground: oklch(0.22 0.04 80);
  --destructive: oklch(0.62 0.2 25);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.7 0.15 150);
  --chart-1: oklch(0.72 0.15 150);
  --chart-2: oklch(0.83 0.13 80);
  --chart-3: oklch(0.7 0.12 200);
  --chart-4: oklch(0.68 0.14 30);
  --chart-5: oklch(0.6 0.1 145);
  --sidebar: oklch(0.16 0.02 150);
  --sidebar-foreground: oklch(0.95 0.01 140);
  --sidebar-primary: oklch(0.7 0.15 150);
  --sidebar-primary-foreground: oklch(0.16 0.03 150);
  --sidebar-accent: oklch(0.26 0.03 150);
  --sidebar-accent-foreground: oklch(0.96 0.01 140);
  --sidebar-border: oklch(1 0 0 / 12%);
  --sidebar-ring: oklch(0.7 0.15 150);
}
```

Añadir al final del archivo, dentro de `@layer base`, una utilidad para cifras tabulares:

```css
@layer base {
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
}
```

- [ ] **Step 4: Verificar tipos y render**

Run: `npx tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard` → 200, sin errores en consola del dev server.

- [ ] **Step 5: Checkpoint** — primitivo chart disponible, recharts instalado, modo oscuro rebrandeado.

---

### Task 2: AnalyticsService (agregaciones temporales) + wiring en container

**Files:**
- Create: `src/core/application/analytics-service.ts`
- Modify: `src/infrastructure/container.ts`

**Interfaces:**
- Consumes: `Repository<T>` (`findAll()`), entidades `RegistroActividad`, `ValeSalida`, `Siembra`, `Semillero`.
- Produces:
  - `analyticsService(): AnalyticsService`
  - `AnalyticsService.costosPorMes(): Promise<PuntoMensual[]>` con `PuntoMensual = { mes: string; manoObra: number; insumos: number; total: number }`
  - `AnalyticsService.plantasPorMes(): Promise<PuntoSiembra[]>` con `PuntoSiembra = { mes: string; plantas: number }`
  - `AnalyticsService.mezclaCostos(): Promise<MezclaCosto[]>` con `MezclaCosto = { categoria: string; valor: number }`

- [ ] **Step 1: Crear el servicio**

Create `src/core/application/analytics-service.ts`:

```ts
import type {
  RegistroActividad,
  Semillero,
  Siembra,
  ValeSalida,
} from "@/core/domain/entities"
import type { Repository } from "@/core/domain/repositories"

export interface PuntoMensual {
  mes: string
  manoObra: number
  insumos: number
  total: number
}

export interface PuntoSiembra {
  mes: string
  plantas: number
}

export interface MezclaCosto {
  categoria: string
  valor: number
}

/** Returns the "YYYY-MM" month key for an ISO date string. */
function mesDe(fecha: string): string {
  return (fecha ?? "").slice(0, 7) || "0000-00"
}

/**
 * Read-only presentation analytics: temporal aggregations over existing data.
 * No domain rules live here — only grouping/summing for charts.
 */
export class AnalyticsService {
  constructor(
    private readonly registros: Repository<RegistroActividad>,
    private readonly vales: Repository<ValeSalida>,
    private readonly siembras: Repository<Siembra>,
    private readonly semilleros: Repository<Semillero>,
  ) {}

  /** Monthly labor (registros) vs inputs (vales) cost series. */
  async costosPorMes(): Promise<PuntoMensual[]> {
    const [registros, vales] = await Promise.all([
      this.registros.findAll(),
      this.vales.findAll(),
    ])
    const map = new Map<string, PuntoMensual>()
    const bucket = (mes: string): PuntoMensual => {
      let e = map.get(mes)
      if (!e) {
        e = { mes, manoObra: 0, insumos: 0, total: 0 }
        map.set(mes, e)
      }
      return e
    }
    for (const r of registros) {
      const e = bucket(mesDe(r.fecha))
      e.manoObra += r.costo
      e.total += r.costo
    }
    for (const v of vales) {
      const importe = v.detalles.reduce(
        (acc, d) => acc + d.cantidad * d.costoUnitario,
        0,
      )
      const e = bucket(mesDe(v.fecha))
      e.insumos += importe
      e.total += importe
    }
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes))
  }

  /** Monthly planted-plants series. */
  async plantasPorMes(): Promise<PuntoSiembra[]> {
    const siembras = await this.siembras.findAll()
    const map = new Map<string, PuntoSiembra>()
    for (const s of siembras) {
      const mes = mesDe(s.fecha)
      const e = map.get(mes) ?? { mes, plantas: 0 }
      e.plantas += s.cantidadPlantas
      map.set(mes, e)
    }
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes))
  }

  /** Global cost mix: labor vs inputs vs machinery. */
  async mezclaCostos(): Promise<MezclaCosto[]> {
    const [registros, vales, semilleros] = await Promise.all([
      this.registros.findAll(),
      this.vales.findAll(),
      this.semilleros.findAll(),
    ])
    const manoObra = registros.reduce((acc, r) => acc + r.costo, 0)
    const insumos = vales.reduce(
      (acc, v) =>
        acc + v.detalles.reduce((a, d) => a + d.cantidad * d.costoUnitario, 0),
      0,
    )
    const maquinaria = semilleros.reduce((acc, s) => acc + s.costoMaquinaria, 0)
    return [
      { categoria: "Mano de obra", valor: manoObra },
      { categoria: "Insumos", valor: insumos },
      { categoria: "Maquinaria", valor: maquinaria },
    ].filter((m) => m.valor > 0)
  }
}
```

- [ ] **Step 2: Wire en el container**

En `src/infrastructure/container.ts`, añadir el import y la factory:

```ts
import { AnalyticsService } from "@/core/application/analytics-service"
```

```ts
export function analyticsService(): AnalyticsService {
  return new AnalyticsService(
    repository("registrosActividad"),
    repository("valesSalida"),
    repository("siembras"),
    repository("semilleros"),
  )
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Checkpoint** — agregaciones temporales disponibles vía `analyticsService()`.

---

### Task 3: Primitivos de presentación reutilizables

**Files:**
- Create: `src/presentation/components/stat-card.tsx`
- Create: `src/presentation/components/chart-card.tsx`
- Create: `src/presentation/components/section-header.tsx`
- Create: `src/presentation/components/status-badge.tsx`
- Create: `src/presentation/components/empty-state.tsx`

**Interfaces:**
- Produces:
  - `StatCard(props: { label: string; value: string; delta?: number; spark?: number[]; icon?: LucideIcon; href?: string })`
  - `ChartCard(props: { title: string; description?: string; action?: ReactNode; children: ReactNode })`
  - `SectionHeader(props: { title: string; description?: string; action?: ReactNode })`
  - `StatusBadge(props: { estado: string })`
  - `EmptyState(props: { message?: string })`

- [ ] **Step 1: EmptyState**

Create `src/presentation/components/empty-state.tsx`:

```tsx
import { Inbox } from "lucide-react"

export function EmptyState({ message = "Sin datos para mostrar." }: { message?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Inbox className="size-6" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
```

- [ ] **Step 2: SectionHeader**

Create `src/presentation/components/section-header.tsx`:

```tsx
import type { ReactNode } from "react"

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
```

- [ ] **Step 3: StatusBadge**

Create `src/presentation/components/status-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TONE: Record<string, string> = {
  activo: "border-transparent bg-primary/15 text-primary",
  planeado: "border-transparent bg-chart-3/15 text-chart-3",
  cosechado: "border-transparent bg-accent/20 text-accent-foreground",
  cerrado: "border-transparent bg-muted text-muted-foreground",
  inactivo: "border-transparent bg-muted text-muted-foreground",
  pendiente: "border-transparent bg-accent/20 text-accent-foreground",
  pagada: "border-transparent bg-primary/15 text-primary",
  vencida: "border-transparent bg-destructive/15 text-destructive",
  surtida: "border-transparent bg-primary/15 text-primary",
  cancelada: "border-transparent bg-destructive/15 text-destructive",
  entrada: "border-transparent bg-primary/15 text-primary",
  salida: "border-transparent bg-accent/20 text-accent-foreground",
}

export function StatusBadge({ estado }: { estado: string }) {
  const key = (estado ?? "").toLowerCase()
  return (
    <Badge variant="outline" className={cn("capitalize", TONE[key])}>
      {estado}
    </Badge>
  )
}
```

- [ ] **Step 4: ChartCard**

Create `src/presentation/components/chart-card.tsx`:

```tsx
import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ChartCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: StatCard (cliente, con sparkline)**

Create `src/presentation/components/stat-card.tsx`:

```tsx
"use client"

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  delta,
  spark,
  icon: Icon,
  href,
}: {
  label: string
  value: string
  delta?: number
  spark?: number[]
  icon?: LucideIcon
  href?: string
}) {
  const up = (delta ?? 0) >= 0
  const body = (
    <Card className="h-full transition-colors hover:border-primary">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon && <Icon className="size-4 text-primary" />}
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
          {typeof delta === "number" && (
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-0.5 text-xs font-medium",
                up ? "text-primary" : "text-destructive",
              )}
            >
              {up ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
        {spark && spark.length > 1 && (
          <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark.map((v, i) => ({ i, v }))}>
                <defs>
                  <linearGradient id={`sp-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill={`url(#sp-${label})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{body}</Link> : body
}
```

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Checkpoint** — kit de primitivos listo.

---

### Task 4: Componentes de gráficas del dashboard

**Files:**
- Create: `src/presentation/components/charts/area-costos.tsx`
- Create: `src/presentation/components/charts/donut-mezcla.tsx`
- Create: `src/presentation/components/charts/bar-top-productos.tsx`
- Create: `src/presentation/components/charts/line-plantas.tsx`

**Interfaces:**
- Consumes: `PuntoMensual`, `MezclaCosto`, `PuntoSiembra` (de analytics-service); `{ nombre: string; valor: number }` para top productos.
- Produces:
  - `AreaCostos({ data: PuntoMensual[] })`
  - `DonutMezcla({ data: MezclaCosto[] })`
  - `BarTopProductos({ data: { nombre: string; valor: number }[] })`
  - `LinePlantas({ data: PuntoSiembra[] })`

- [ ] **Step 1: AreaCostos (área apilada mano obra vs insumos)**

Create `src/presentation/components/charts/area-costos.tsx`:

```tsx
"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { PuntoMensual } from "@/core/application/analytics-service"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  manoObra: { label: "Mano de obra", color: "var(--chart-1)" },
  insumos: { label: "Insumos", color: "var(--chart-2)" },
} satisfies ChartConfig

export function AreaCostos({ data }: { data: PuntoMensual[] }) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillMo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          dataKey="manoObra"
          type="monotone"
          stackId="a"
          stroke="var(--chart-1)"
          fill="url(#fillMo)"
        />
        <Area
          dataKey="insumos"
          type="monotone"
          stackId="a"
          stroke="var(--chart-2)"
          fill="url(#fillIn)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
```

- [ ] **Step 2: DonutMezcla**

Create `src/presentation/components/charts/donut-mezcla.tsx`:

```tsx
"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { MezclaCosto } from "@/core/application/analytics-service"
import { EmptyState } from "@/presentation/components/empty-state"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"]
const config = {
  valor: { label: "Costo" },
} satisfies ChartConfig

export function DonutMezcla({ data }: { data: MezclaCosto[] }) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-64">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie data={data} dataKey="valor" nameKey="categoria" innerRadius={60} strokeWidth={4}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="categoria" />} />
      </PieChart>
    </ChartContainer>
  )
}
```

- [ ] **Step 3: BarTopProductos (barras horizontales)**

Create `src/presentation/components/charts/bar-top-productos.tsx`:

```tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  valor: { label: "Valor", color: "var(--chart-1)" },
} satisfies ChartConfig

export function BarTopProductos({
  data,
}: {
  data: { nombre: string; valor: number }[]
}) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="nombre"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="valor" fill="var(--chart-1)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
```

- [ ] **Step 4: LinePlantas**

Create `src/presentation/components/charts/line-plantas.tsx`:

```tsx
"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { PuntoSiembra } from "@/core/application/analytics-service"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  plantas: { label: "Plantas", color: "var(--chart-1)" },
} satisfies ChartConfig

export function LinePlantas({ data }: { data: PuntoSiembra[] }) {
  if (data.length === 0) return <EmptyState />
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={56} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="plantas"
          type="monotone"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
```

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Checkpoint** — 4 gráficas de dashboard listas.

---

### Task 5: Reconstruir el Dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx` (reemplazo completo)

**Interfaces:**
- Consumes: `analyticsService()`, `inventoryService()`, `loadRecords`, `StatCard`, `ChartCard`, `SectionHeader`, y las 4 gráficas de Task 4.

- [ ] **Step 1: Reescribir la página**

Reemplazar el contenido completo de `src/app/dashboard/page.tsx`:

```tsx
import { Boxes, Leaf, MapPin, Sprout } from "lucide-react"
import { inventoryService, analyticsService } from "@/infrastructure/container"
import { PageHeader } from "@/presentation/components/page-header"
import { StatCard } from "@/presentation/components/stat-card"
import { ChartCard } from "@/presentation/components/chart-card"
import { SectionHeader } from "@/presentation/components/section-header"
import { AreaCostos } from "@/presentation/components/charts/area-costos"
import { DonutMezcla } from "@/presentation/components/charts/donut-mezcla"
import { BarTopProductos } from "@/presentation/components/charts/bar-top-productos"
import { LinePlantas } from "@/presentation/components/charts/line-plantas"
import { MODULES } from "@/presentation/config/modules"
import { loadRecords } from "@/presentation/queries"
import Link from "next/link"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n)

export default async function DashboardHome() {
  const analytics = analyticsService()
  const [ranchos, parcelas, ciclos, existencias, costosMes, plantasMes, mezcla] =
    await Promise.all([
      loadRecords("ranchos"),
      loadRecords("parcelas"),
      loadRecords("ciclos"),
      inventoryService().existencias(),
      analytics.costosPorMes(),
      analytics.plantasPorMes(),
      analytics.mezclaCostos(),
    ])

  const valorInventario = existencias.reduce((a, e) => a + e.valorInventario, 0)
  const ciclosActivos = (ciclos as { estado: string }[]).filter(
    (c) => c.estado === "activo",
  ).length

  const topProductos = [...existencias]
    .sort((a, b) => b.valorInventario - a.valorInventario)
    .slice(0, 6)
    .map((e) => ({ nombre: e.producto.nombreComercial, valor: Math.round(e.valorInventario) }))

  const sparkCostos = costosMes.map((m) => m.total)
  const sparkPlantas = plantasMes.map((m) => m.plantas)

  const stats = [
    { label: "Ranchos", value: ranchos.length.toString(), icon: MapPin, href: "/dashboard/ranchos" },
    { label: "Parcelas", value: parcelas.length.toString(), icon: Leaf, href: "/dashboard/parcelas" },
    { label: "Ciclos activos", value: ciclosActivos.toString(), icon: Sprout, href: "/dashboard/ciclos" },
    { label: "Valor de inventario", value: currency(valorInventario), icon: Boxes, href: "/dashboard/kardex", spark: sparkCostos },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        badge="Sistema de gestión agrícola"
        title="Producción de Piña"
        description="Control de costos e inversiones por rancho, parcela, plantilla y ciclo, con trazabilidad completa de la cadena de compras."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Costos por mes" description="Mano de obra vs. insumos">
            <AreaCostos data={costosMes} />
          </ChartCard>
        </div>
        <ChartCard title="Mezcla de costos" description="Distribución global">
          <DonutMezcla data={mezcla} />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top productos por valor" description="Valor de inventario (PEPS)">
          <BarTopProductos data={topProductos} />
        </ChartCard>
        <ChartCard title="Plantas sembradas por mes" description={`${sparkPlantas.reduce((a, b) => a + b, 0).toLocaleString("es-MX")} plantas en total`}>
          <LinePlantas data={plantasMes} />
        </ChartCard>
      </section>

      <section>
        <SectionHeader title="Accesos rápidos" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((m) => (
            <Link
              key={m.slug}
              href={`/dashboard/${m.slug}`}
              className="rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:border-primary"
            >
              <p className="font-medium text-foreground">{m.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.group}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard` → 200; aparecen KPIs, área, donut, barras y línea con datos semilla.

- [ ] **Step 3: Checkpoint** — dashboard premium funcionando.

---

### Task 6: Gráfica en Costeo

**Files:**
- Create: `src/presentation/components/charts/bar-costeo-nivel.tsx`
- Modify: `src/app/dashboard/costeo/page.tsx`

**Interfaces:**
- Consumes: `ResumenCosto[]` (de costing-service), `Record<string,string>` labels.
- Produces: `BarCosteoNivel({ rows, labels }: { rows: ResumenCosto[]; labels: Record<string, string> })`

- [ ] **Step 1: Crear la gráfica de barras apiladas**

Create `src/presentation/components/charts/bar-costeo-nivel.tsx`:

```tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { ResumenCosto } from "@/core/application/costing-service"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  manoObra: { label: "Mano de obra", color: "var(--chart-1)" },
  insumos: { label: "Insumos", color: "var(--chart-2)" },
} satisfies ChartConfig

export function BarCosteoNivel({
  rows,
  labels,
}: {
  rows: ResumenCosto[]
  labels: Record<string, string>
}) {
  if (rows.length === 0) return <EmptyState />
  const data = rows.slice(0, 8).map((r) => ({
    nombre: labels[r.clave] ?? r.clave,
    manoObra: r.manoObra,
    insumos: r.insumos,
  }))
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="nombre" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={56} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="manoObra" stackId="a" fill="var(--chart-1)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="insumos" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
```

- [ ] **Step 2: Insertar la gráfica en la página de costeo**

En `src/app/dashboard/costeo/page.tsx`, importar el componente y la ChartCard:

```tsx
import { ChartCard } from "@/presentation/components/chart-card"
import { BarCosteoNivel } from "@/presentation/components/charts/bar-costeo-nivel"
```

Dentro del `<Card>` de cada nivel (reemplazando solo el `<CardContent>` para añadir gráfica encima de la tabla), envolver así dentro del map de `NIVELES`:

```tsx
<Card key={nivel.key}>
  <CardHeader>
    <CardTitle className="text-base">{nivel.title}</CardTitle>
  </CardHeader>
  <CardContent className="flex flex-col gap-4">
    <BarCosteoNivel rows={resumenes[i]} labels={labels} />
    <CostoTable rows={resumenes[i]} labels={labels} />
  </CardContent>
</Card>
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/costeo` → 200; barras apiladas por nivel sobre cada tabla.

- [ ] **Step 4: Checkpoint** — costeo con gráficas.

---

### Task 7: Gráfica en Kardex

**Files:**
- Create: `src/presentation/components/charts/area-kardex.tsx`
- Modify: `src/presentation/components/kardex-view.tsx`

**Interfaces:**
- Consumes: `KardexRow[]` (de inventory-service: tiene `fecha`, `saldoImporte`).
- Produces: `AreaKardex({ rows }: { rows: { fecha: string; saldoImporte: number }[] })`

- [ ] **Step 1: Inspeccionar kardex-view**

Run: `npx tsc --noEmit` (baseline)
Leer `src/presentation/components/kardex-view.tsx` para localizar dónde se renderiza la tabla y qué prop contiene las filas (`KardexRow[]`).

- [ ] **Step 2: Crear AreaKardex**

Create `src/presentation/components/charts/area-kardex.tsx`:

```tsx
"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { EmptyState } from "@/presentation/components/empty-state"

const config = {
  saldoImporte: { label: "Saldo valor", color: "var(--chart-1)" },
} satisfies ChartConfig

export function AreaKardex({
  rows,
}: {
  rows: { fecha: string; saldoImporte: number }[]
}) {
  if (rows.length === 0) return <EmptyState message="Selecciona un producto con movimientos." />
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <AreaChart data={rows} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={64} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillKardex" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          dataKey="saldoImporte"
          type="monotone"
          stroke="var(--chart-1)"
          fill="url(#fillKardex)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
```

- [ ] **Step 3: Insertar en kardex-view**

En `src/presentation/components/kardex-view.tsx`, importar:

```tsx
import { AreaKardex } from "@/presentation/components/charts/area-kardex"
import { StatusBadge } from "@/presentation/components/status-badge"
```

Justo antes de la tabla de movimientos, renderizar la gráfica con las filas actuales (sustituir `rowsVar` por el nombre real de la variable de `KardexRow[]` identificada en Step 1):

```tsx
<AreaKardex rows={rowsVar.map((r) => ({ fecha: r.fecha, saldoImporte: r.saldoImporte }))} />
```

Y reemplazar la celda de tipo `entrada`/`salida` para usar `<StatusBadge estado={r.tipo} />` en lugar de texto plano.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/kardex` → 200; al elegir producto aparece área de saldo + badges entrada/salida.

- [ ] **Step 5: Checkpoint** — kardex con gráfica.

---

### Task 8: Timeline visual en Trazabilidad

**Files:**
- Modify: `src/presentation/components/trace-view.tsx`

**Interfaces:**
- Consumes: la estructura de eventos que ya produce `traceability-service` y consume `trace-view.tsx`.

- [ ] **Step 1: Inspeccionar trace-view**

Leer `src/presentation/components/trace-view.tsx` y `src/core/application/traceability-service.ts` para conocer la forma exacta de los eventos (campos de etiqueta, fecha y detalle).

- [ ] **Step 2: Renderizar como timeline vertical**

Sustituir el render de lista/texto plano de los eventos por un timeline con conectores. Patrón (ajustar nombres de campos a los reales hallados en Step 1):

```tsx
<ol className="relative ml-3 border-l border-border">
  {eventos.map((ev, i) => (
    <li key={i} className="mb-6 ml-6">
      <span className="absolute -left-2.5 flex size-5 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
      <h3 className="text-sm font-semibold text-foreground">{ev.titulo}</h3>
      {ev.fecha && (
        <time className="text-xs text-muted-foreground">{ev.fecha}</time>
      )}
      {ev.detalle && (
        <p className="mt-1 text-sm text-muted-foreground">{ev.detalle}</p>
      )}
    </li>
  ))}
</ol>
```

Si la traza son múltiples cadenas, envolver cada cadena en una `Card` con su `<ol>`.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/trazabilidad` → 200; cadena se ve como línea de tiempo con nodos.

- [ ] **Step 4: Checkpoint** — trazabilidad visual.

---

### Task 9: Pulido de Reportes

**Files:**
- Modify: `src/app/dashboard/reportes/page.tsx`

- [ ] **Step 1: Inspeccionar la página**

Leer `src/app/dashboard/reportes/page.tsx` para ver qué secciones/datos muestra.

- [ ] **Step 2: Aplicar primitivos**

Envolver cada categoría de reporte (Producción, Inventario, Compras, Costos) en una `ChartCard` o `Card` con `SectionHeader`, usar `StatusBadge` donde haya estados, y cifras con `tabular-nums`. Reutilizar `BarTopProductos`/`LinePlantas` si alguna sección ya carga esos datos; si no, mantener tablas pero con el contenedor pulido. No inventar datos nuevos: usar solo lo que la página ya carga.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/reportes` → 200.

- [ ] **Step 4: Checkpoint** — reportes pulidos.

---

### Task 10: Verificación global

**Files:** (ninguno nuevo)

- [ ] **Step 1: Typecheck completo**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: sin errores (warnings tolerables).

- [ ] **Step 3: Build de producción**

Run: `pnpm build`
Expected: build exitoso, sin errores de tipos ni de Next.

- [ ] **Step 4: Recorrido de rutas en dev**

Con `pnpm dev` corriendo, cargar y revisar a ojo (claro y oscuro):
`/dashboard`, `/dashboard/costeo`, `/dashboard/kardex`, `/dashboard/trazabilidad`, `/dashboard/reportes`, y 2 CRUD (`/dashboard/ranchos`, `/dashboard/movimientos`).
Expected: todas 200, gráficas renderizan, sin errores de hidratación en consola.

- [ ] **Step 5: Checkpoint final** — rediseño premium completo y verificado.

---

## Self-Review

- **Spec coverage:** sistema visual (Task 1) ✓; kit de componentes (Task 3) ✓; dashboard + 4 gráficas (Tasks 4-5) ✓; costeo (Task 6) ✓; kardex (Task 7) ✓; trazabilidad timeline (Task 8) ✓; reportes (Task 9) ✓; agregación temporal en services (Task 2) ✓; modo oscuro branded (Task 1) ✓; única dep `recharts` (Task 1) ✓; sin tocar dominio/PEPS/datastore ✓.
- **Placeholder scan:** Tasks 7-9 dependen de inspección de archivos existentes (kardex-view, trace-view, reportes) cuyo detalle exacto se resuelve en el Step 1 de cada una; el código mostrado es completo salvo el nombre de variable a sustituir, señalado explícitamente.
- **Type consistency:** `PuntoMensual`/`PuntoSiembra`/`MezclaCosto` definidos en Task 2 y consumidos con la misma firma en Tasks 4-5. `ResumenCosto`/`KardexRow` provienen de services existentes ya verificados.
