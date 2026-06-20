# Reportes en PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Botón "Descargar PDF" en `/dashboard/reportes` que genera en cliente un PDF branded de inventario valorizado.

**Architecture:** `@react-pdf/renderer` cargado por import dinámico al hacer click (fuera del bundle inicial). El documento (`report-pdf.tsx`) se maqueta con primitivos react-pdf; un botón cliente arma el blob y lo descarga; la página server pasa los datos ya calculados.

**Tech Stack:** Next.js 16, React 19, @react-pdf/renderer, shadcn.

## Global Constraints

- pnpm siempre (`pnpm add`, `pnpm exec`). Sin npx/npm.
- Única dep nueva: `@react-pdf/renderer`. Cargada por `import()` dinámico (no en bundle inicial; type-only imports en server/botón para no inflar).
- Moneda `Intl.NumberFormat("es-MX", { currency: "MXN" })`. Sin servidor, sin API keys, sin tocar dominio/servicios.
- **Entorno:** NO git, NO test runner. Verificación por tarea = `pnpm exec tsc --noEmit` sin errores nuevos + `/dashboard/reportes` carga 200 sin `__next_error__`. Sin commits.

---

### Task 1: Dependencia + documento PDF

**Files:**
- Modify: `package.json` (vía pnpm add)
- Create: `src/presentation/components/report-pdf.tsx`

**Interfaces:**
- Produces:
  - type `ReportePDFData = { generadoEl: string; valorTotal: number; totalProductos: number; unidadesTotal: number; filas: { producto: string; existencia: number; costoPromedio: number; valorInventario: number }[]; top: { nombre: string; valor: number }[] }`
  - `ReporteInventarioDoc({ data }: { data: ReportePDFData }): JSX.Element` (componente Document de react-pdf)

- [ ] **Step 1: Instalar**

Run: `pnpm add @react-pdf/renderer`
Expected: `@react-pdf/renderer` en dependencies.

- [ ] **Step 2: Crear el documento**

Create `src/presentation/components/report-pdf.tsx`:

```tsx
import {
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"

export interface ReportePDFData {
  generadoEl: string
  valorTotal: number
  totalProductos: number
  unidadesTotal: number
  filas: {
    producto: string
    existencia: number
    costoPromedio: number
    valorInventario: number
  }[]
  top: { nombre: string; valor: number }[]
}

const mxn = (n: number) =>
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
    marginBottom: 16,
  },
  brand: { fontSize: 15, fontFamily: "Helvetica-Bold", color: GREEN },
  sub: { fontSize: 9, color: MUTED },
  headerRight: { marginLeft: "auto", textAlign: "right" },
  kpis: { flexDirection: "row", gap: 10, marginBottom: 18 },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 10,
  },
  kpiLabel: { fontSize: 8, color: MUTED, marginBottom: 4 },
  kpiValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 8,
  },
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
  cProducto: { flex: 1 },
  cNum: { width: 90, textAlign: "right" },
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

function Logo() {
  return (
    <Svg width={34} height={34} viewBox="0 0 180 180">
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

export function ReporteInventarioDoc({ data }: { data: ReportePDFData }) {
  return (
    <Document
      title="Reporte de inventario valorizado"
      author="AgroPiña"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Logo />
          <View>
            <Text style={s.brand}>AgroPiña</Text>
            <Text style={s.sub}>Inventario valorizado (PEPS)</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.sub}>Generado</Text>
            <Text style={s.bold}>{data.generadoEl}</Text>
          </View>
        </View>

        <View style={s.kpis}>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Valor total en almacén</Text>
            <Text style={s.kpiValue}>{mxn(data.valorTotal)}</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Productos en catálogo</Text>
            <Text style={s.kpiValue}>
              {data.totalProductos.toLocaleString("es-MX")}
            </Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Unidades en existencia</Text>
            <Text style={s.kpiValue}>
              {data.unidadesTotal.toLocaleString("es-MX")}
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Inventario valorizado</Text>
        <View style={s.tHead}>
          <Text style={[s.th, s.cProducto]}>Producto</Text>
          <Text style={[s.th, s.cNum]}>Existencia</Text>
          <Text style={[s.th, s.cNum]}>Costo prom.</Text>
          <Text style={[s.th, s.cNum]}>Valor</Text>
        </View>
        {data.filas.map((f, i) => (
          <View key={i} style={s.tRow} wrap={false}>
            <Text style={s.cProducto}>{f.producto}</Text>
            <Text style={s.cNum}>{f.existencia.toLocaleString("es-MX")}</Text>
            <Text style={s.cNum}>{mxn(f.costoPromedio)}</Text>
            <Text style={[s.cNum, s.bold]}>{mxn(f.valorInventario)}</Text>
          </View>
        ))}
        <View style={s.tTotal}>
          <Text style={[s.cProducto, s.bold]}>Total</Text>
          <Text style={s.cNum} />
          <Text style={s.cNum} />
          <Text style={[s.cNum, s.bold]}>{mxn(data.valorTotal)}</Text>
        </View>

        <Text style={s.sectionTitle}>Top productos por valor</Text>
        <View style={s.tHead}>
          <Text style={[s.th, s.cProducto]}>#  Producto</Text>
          <Text style={[s.th, s.cNum]}>Valor</Text>
        </View>
        {data.top.map((t, i) => (
          <View key={i} style={s.tRow} wrap={false}>
            <Text style={s.cProducto}>
              {i + 1}.  {t.nombre}
            </Text>
            <Text style={[s.cNum, s.bold]}>{mxn(t.valor)}</Text>
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text>AgroPiña · Sistema de gestión agrícola</Text>
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
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Checkpoint** — documento PDF listo.

---

### Task 2: Botón de descarga (lazy)

**Files:**
- Create: `src/presentation/components/download-report-button.tsx`

**Interfaces:**
- Consumes: `ReportePDFData` (type-only, Task 1), `@react-pdf/renderer` (dinámico), `Button`, `toast`.
- Produces: `DownloadReportButton({ data, fileBase? }: { data: ReportePDFData; fileBase?: string })`

- [ ] **Step 1: Crear el botón**

Create `src/presentation/components/download-report-button.tsx`:

```tsx
"use client"

import { FileDown } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { ReportePDFData } from "./report-pdf"

export function DownloadReportButton({
  data,
  fileBase = "Reporte-inventario",
}: {
  data: ReportePDFData
  fileBase?: string
}) {
  const [busy, setBusy] = useState(false)

  async function handle() {
    setBusy(true)
    try {
      const [{ pdf }, { ReporteInventarioDoc }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./report-pdf"),
      ])
      const blob = await pdf(<ReporteInventarioDoc data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${fileBase}-${data.generadoEl}.pdf`
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

  return (
    <Button onClick={handle} disabled={busy} variant="outline">
      <FileDown className="size-4" />
      {busy ? "Generando…" : "Descargar PDF"}
    </Button>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Checkpoint** — botón lazy listo.

---

### Task 3: Integrar en la página de Reportes

**Files:**
- Modify: `src/app/dashboard/reportes/page.tsx`

- [ ] **Step 1: Importar tipo + botón**

En `src/app/dashboard/reportes/page.tsx`, añadir imports:

```tsx
import { DownloadReportButton } from "@/presentation/components/download-report-button"
import type { ReportePDFData } from "@/presentation/components/report-pdf"
```

- [ ] **Step 2: Armar los datos y colocar el botón**

Tras calcular `topProductos` (después de la línea `const iconCls = ...`), agregar:

```tsx
  const pdfData: ReportePDFData = {
    generadoEl: new Date().toISOString().slice(0, 10),
    valorTotal,
    totalProductos: productos.length,
    unidadesTotal,
    filas: existencias.map((e) => ({
      producto: productoLabel(e.producto.id),
      existencia: e.existencia,
      costoPromedio: e.costoPromedio,
      valorInventario: e.valorInventario,
    })),
    top: topProductos,
  }
```

Reemplazar el bloque `<PageHeader title="Reportes" ... />` por un encabezado con el botón a la derecha:

```tsx
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Reportes"
          description="Indicadores consolidados de inventario valorizado."
        />
        <DownloadReportButton data={pdfData} />
      </div>
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/reportes` → 200; aparece el botón "Descargar PDF" junto al título.

- [ ] **Step 4: Checkpoint** — botón integrado.

---

### Task 4: Verificación global

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 2: Rutas**

Cargar (200 + sin `__next_error__`): `/dashboard/reportes`, `/dashboard`, `/dashboard/mapa`.

- [ ] **Step 3: Revisión a ojo**

En `/dashboard/reportes`, click "Descargar PDF" → descarga `Reporte-inventario-<fecha>.pdf` con logo piña, fecha, 3 KPIs, tabla de inventario con total, y top productos. Confirmar que el bundle inicial de la página no incluye @react-pdf (se carga al click).

- [ ] **Step 4: Checkpoint final** — PDF de reportes completo.

---

## Self-Review

- **Spec coverage:** dep @react-pdf lazy (T1+T2) ✓; documento branded con logo/fecha/KPIs/tabla+total/top (T1) ✓; botón descarga blob (T2) ✓; wiring en page con datos reales (T3) ✓; sin servidor/dominio (todas) ✓.
- **Placeholder scan:** sin TBD/TODO; código completo.
- **Type consistency:** `ReportePDFData` definido en T1, consumido idéntico en T2 (botón) y T3 (page); `ReporteInventarioDoc` firma `{ data }` consistente T1↔T2; `DownloadReportButton` props `{ data, fileBase? }` consistente T2↔T3.
