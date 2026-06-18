# Subsistema Mapa de parcelas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página `/dashboard/mapa` con base satelital, polígonos de parcela por estado, panel de detalle con costos reales, y dibujo/edición/guardado de geometría.

**Architecture:** mapcn (MapLibre GL) como shell; capas custom sobre la instancia cruda: raster Esri (satélite) + GeoJSON de parcelas. Geometría opcional en la entidad `Parcela`, persistida vía server action sobre el datastore JSON. terra-draw para editar. Todo el mapa es cliente (`dynamic ssr:false`).

**Tech Stack:** Next.js 16, React 19, mapcn/`maplibre-gl`, `terra-draw` (+ adapter MapLibre), shadcn base-ui, Recharts (no nuevo).

## Global Constraints

- Usar **pnpm** siempre (`pnpm dlx`, `pnpm add`, `pnpm exec`). Nunca npx/npm.
- Sin API keys ni servicios de pago. Tiles satelitales = Esri World Imagery (gratis, atribución). Sin NDVI/clima/score.
- Cambios al dominio: SOLO agregar `geometria?` opcional a `Parcela` (aditivo). No tocar PEPS/costeo/datastore core.
- MapLibre/terra-draw son client-only → `dynamic(() => import(...), { ssr:false })`.
- **Entorno:** NO git, NO test runner. Verificación por tarea = `pnpm exec tsc --noEmit` sin errores nuevos + ruta carga 200 sin `__next_error__` en :3000. Sin commits.
- Server actions: patrón existente (`"use server"`, `crudService(...).update`, `revalidatePath`).

---

### Task 1: Instalar mapcn + confirmar API de la instancia

**Files:**
- Create: `src/components/ui/map.tsx` (lo genera mapcn)
- Modify: `package.json` (maplibre-gl)

- [ ] **Step 1: Instalar el componente mapcn**

Run: `pnpm dlx shadcn@latest add @mapcn/map`
Expected: crea `src/components/ui/map.tsx`, añade `maplibre-gl` a dependencies. Si pide sobrescribir otros, NO.

- [ ] **Step 2: Leer el componente instalado y anotar cómo obtener la instancia MapLibre**

Leer `src/components/ui/map.tsx`. Identificar: nombre del export (ej. `Map`), cómo expone la instancia cruda (prop `onReady`/`onLoad`/`ref`/hook `useMap`), y props de estilo/tiles. Anotar esos nombres exactos para Task 4.

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores nuevos. `maplibre-gl` en package.json.

- [ ] **Step 4: Instalar terra-draw**

Run: `pnpm add terra-draw`
Expected: añadido (el adapter MapLibre puede venir incluido o como `@terra-draw/maplibre-gl-adapter`; si es paquete aparte, instalarlo también). Confirmar el export del adapter leyendo `node_modules/terra-draw` o su `package.json` `exports`.

- [ ] **Step 5: Checkpoint** — mapcn + maplibre-gl + terra-draw instalados; API de instancia anotada.

---

### Task 2: Campo `geometria` en Parcela + seed de polígonos demo

**Files:**
- Modify: `src/core/domain/entities.ts`
- Modify: `scripts/seed-rich.mjs`
- Modify (generado): `.data/database.json`, `src/infrastructure/persistence/seed.json`

**Interfaces:**
- Produces: tipo `GeoPolygon = { type: "Polygon"; coordinates: number[][][] }`; `Parcela.geometria?: GeoPolygon | null`.

- [ ] **Step 1: Agregar el tipo y el campo opcional**

En `src/core/domain/entities.ts`, antes de `Parcela`, agregar:

```ts
export interface GeoPolygon {
  type: "Polygon"
  /** [ [ [lng, lat], ... ] ] — anillo exterior en grados. */
  coordinates: number[][][]
}
```

Y en `interface Parcela`, agregar al final:

```ts
  geometria?: GeoPolygon | null
```

- [ ] **Step 2: Generar polígonos demo en el seed**

En `scripts/seed-rich.mjs`, dentro del arreglo `parcelas`, agregar `geometria` a cada parcela. Polígonos pequeños separados cerca de Loma Bonita, Oaxaca / Veracruz (zona piñera, ~ -95.88, 18.10). Insertar este helper antes de `const parcelas = [` y usar sus salidas:

```js
// Pequeño rectángulo (~300x300 m) alrededor de un centro [lng,lat].
function box(lng, lat, d = 0.0025) {
  return {
    type: "Polygon",
    coordinates: [[
      [lng - d, lat - d],
      [lng + d, lat - d],
      [lng + d, lat + d],
      [lng - d, lat + d],
      [lng - d, lat - d],
    ]],
  }
}
const PARCEL_GEO = {
  "parcela-1": box(-95.882, 18.104),
  "parcela-2": box(-95.876, 18.103),
  "parcela-3": box(-95.870, 18.108),
  "parcela-4": box(-95.864, 18.106),
  "parcela-5": box(-95.858, 18.110),
  "parcela-6": box(-95.852, 18.101),
}
```

Y en cada objeto del arreglo `parcelas`, agregar la propiedad `geometria: PARCEL_GEO["parcela-N"]` (con su id correspondiente).

- [ ] **Step 3: Regenerar seed**

Run: `node scripts/seed-rich.mjs`
Expected: "Seed written. Counts: ..." (parcelas: 6).

- [ ] **Step 4: Verificar tipos + dato**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/parcelas` → 200 (la tabla ignora `geometria`, no es columna).

- [ ] **Step 5: Checkpoint** — entidad + seed con geometría.

---

### Task 3: Server action + query del mapa

**Files:**
- Create: `src/presentation/actions/geo-actions.ts`
- Create: `src/presentation/geo-queries.ts`

**Interfaces:**
- Consumes: `crudService`, `repository`, `costingService` (container); `Parcela`, `GeoPolygon`.
- Produces:
  - `saveParcelaGeometria(parcelaId: string, geometria: GeoPolygon | null): Promise<{ ok: boolean; error?: string }>`
  - `loadParcelasMapa(): Promise<ParcelaMapa[]>` con
    `ParcelaMapa = { id: string; identificador: string; ranchoNombre: string; estado: string; superficieM2: number; geometria: GeoPolygon | null; costoTotal: number }`

- [ ] **Step 1: geo-actions.ts**

Create `src/presentation/actions/geo-actions.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import type { GeoPolygon, Parcela } from "@/core/domain/entities"
import { DomainError } from "@/core/domain/errors"
import { crudService } from "@/infrastructure/container"

export async function saveParcelaGeometria(
  parcelaId: string,
  geometria: GeoPolygon | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await crudService<Parcela>("parcelas").update(parcelaId, { geometria })
    revalidatePath("/dashboard/mapa")
    return { ok: true }
  } catch (error) {
    const msg =
      error instanceof DomainError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Error desconocido."
    return { ok: false, error: msg }
  }
}
```

- [ ] **Step 2: geo-queries.ts**

Create `src/presentation/geo-queries.ts`:

```ts
import "server-only"
import type { GeoPolygon, Parcela, Rancho } from "@/core/domain/entities"
import { costingService, repository } from "@/infrastructure/container"

export interface ParcelaMapa {
  id: string
  identificador: string
  ranchoNombre: string
  estado: string
  superficieM2: number
  geometria: GeoPolygon | null
  costoTotal: number
}

export async function loadParcelasMapa(): Promise<ParcelaMapa[]> {
  const [parcelas, ranchos, costos] = await Promise.all([
    repository<Parcela>("parcelas").findAll(),
    repository<Rancho>("ranchos").findAll(),
    costingService().resumenPorNivel("parcelaId"),
  ])
  const ranchoNombre = new Map(ranchos.map((r) => [r.id, r.nombre]))
  const costoPorParcela = new Map(costos.map((c) => [c.clave, c.total]))
  return parcelas.map((p) => ({
    id: p.id,
    identificador: p.identificador,
    ranchoNombre: ranchoNombre.get(p.ranchoId) ?? "—",
    estado: p.estado,
    superficieM2: p.superficieM2,
    geometria: p.geometria ?? null,
    costoTotal: costoPorParcela.get(p.id) ?? 0,
  }))
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Checkpoint** — action + query listos.

---

### Task 4: FieldMap (mapa + satélite + polígonos + selección)

**Files:**
- Create: `src/presentation/components/field-map.tsx`

**Interfaces:**
- Consumes: `ParcelaMapa` (Task 3), `maplibre-gl`, `saveParcelaGeometria` (Task 6 lo usa).
- Produces: `FieldMap({ parcelas }: { parcelas: ParcelaMapa[] })` (componente cliente).

**Nota de integración:** usar `maplibre-gl` directamente dentro del componente (API conocida: `new maplibregl.Map`, `addSource`, `addLayer`, `on('click', layerId, fn)`). Si `src/components/ui/map.tsx` de mapcn expone limpio la instancia (anotado en Task 1), envolver con él; si no, montar `maplibregl.Map` en un `div ref`. Importar el CSS `maplibre-gl/dist/maplibre-gl.css`.

- [ ] **Step 1: Implementar el mapa base + capas**

Create `src/presentation/components/field-map.tsx` (cliente). Estructura (ajustar nombres al API real de maplibre/mapcn confirmado en Task 1):

```tsx
"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import maplibregl from "maplibre-gl"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { ParcelaMapa } from "@/presentation/geo-queries"
import { ParcelaDetailPanel } from "./parcela-detail-panel"

const ESRI =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
const CARTO =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"

function styleWithSatellite(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      esri: {
        type: "raster",
        tiles: [ESRI],
        tileSize: 256,
        attribution: "Tiles © Esri — World Imagery",
      },
    },
    layers: [{ id: "esri", type: "raster", source: "esri" }],
  }
}

function fc(parcelas: ParcelaMapa[]) {
  return {
    type: "FeatureCollection" as const,
    features: parcelas
      .filter((p) => p.geometria)
      .map((p) => ({
        type: "Feature" as const,
        id: p.id,
        properties: { id: p.id, estado: p.estado },
        geometry: p.geometria!,
      })),
  }
}

export function FieldMap({ parcelas }: { parcelas: ParcelaMapa[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [selected, setSelected] = useState<ParcelaMapa | null>(null)
  const [satellite, setSatellite] = useState(true)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const first = parcelas.find((p) => p.geometria)
    const center = first
      ? (first.geometria!.coordinates[0][0] as [number, number])
      : [-95.87, 18.1]
    const map = new maplibregl.Map({
      container: ref.current,
      style: satellite ? styleWithSatellite() : CARTO,
      center: center as [number, number],
      zoom: 13,
    })
    map.addControl(new maplibregl.NavigationControl(), "top-right")
    mapRef.current = map

    map.on("load", () => {
      map.addSource("parcelas", { type: "geojson", data: fc(parcelas) })
      map.addLayer({
        id: "parcelas-fill",
        type: "fill",
        source: "parcelas",
        paint: {
          "fill-color": [
            "match",
            ["get", "estado"],
            "activo", "#34d399",
            "#94a3b8",
          ],
          "fill-opacity": 0.35,
        },
      })
      map.addLayer({
        id: "parcelas-line",
        type: "line",
        source: "parcelas",
        paint: { "line-color": "#10b981", "line-width": 2 },
      })
      map.on("click", "parcelas-fill", (e) => {
        const id = e.features?.[0]?.properties?.id as string
        setSelected(parcelas.find((p) => p.id === id) ?? null)
      })
      map.on("mouseenter", "parcelas-fill", () => {
        map.getCanvas().style.cursor = "pointer"
      })
      map.on("mouseleave", "parcelas-fill", () => {
        map.getCanvas().style.cursor = ""
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Toggle de capa base.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setStyle(satellite ? styleWithSatellite() : CARTO)
    map.once("styledata", () => {
      if (map.getSource("parcelas")) return
      map.addSource("parcelas", { type: "geojson", data: fc(parcelas) })
      map.addLayer({
        id: "parcelas-fill",
        type: "fill",
        source: "parcelas",
        paint: {
          "fill-color": [
            "match",
            ["get", "estado"],
            "activo", "#34d399",
            "#94a3b8",
          ],
          "fill-opacity": 0.35,
        },
      })
      map.addLayer({
        id: "parcelas-line",
        type: "line",
        source: "parcelas",
        paint: { "line-color": "#10b981", "line-width": 2 },
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satellite])

  return (
    <div className="relative h-[70vh] overflow-hidden rounded-lg border border-border">
      <div ref={ref} className="size-full" />
      <div className="absolute left-3 top-3 z-10 flex gap-2">
        <Button
          size="sm"
          variant={satellite ? "default" : "outline"}
          onClick={() => setSatellite(true)}
        >
          Satélite
        </Button>
        <Button
          size="sm"
          variant={!satellite ? "default" : "outline"}
          onClick={() => setSatellite(false)}
        >
          Calle
        </Button>
      </div>
      <ParcelaDetailPanel
        parcela={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores (ParcelaDetailPanel se crea en Task 5; este step puede fallar hasta Task 5 — completar Task 5 antes de typecheck final).

- [ ] **Step 3: Checkpoint** — mapa con satélite + polígonos + selección (pendiente panel).

---

### Task 5: Panel de detalle + página + sidebar

**Files:**
- Create: `src/presentation/components/parcela-detail-panel.tsx`
- Create: `src/app/dashboard/mapa/page.tsx`
- Modify: `src/presentation/components/sidebar-nav.tsx`

**Interfaces:**
- Consumes: `ParcelaMapa`, shadcn `Sheet`, `StatusBadge`, `loadParcelasMapa`, `FieldMap` (vía dynamic).
- Produces: `ParcelaDetailPanel({ parcela, onClose })`.

- [ ] **Step 1: Panel de detalle (Sheet)**

Create `src/presentation/components/parcela-detail-panel.tsx`:

```tsx
"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { ParcelaMapa } from "@/presentation/geo-queries"
import { StatusBadge } from "./status-badge"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)

export function ParcelaDetailPanel({
  parcela,
  onClose,
}: {
  parcela: ParcelaMapa | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!parcela} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Parcela {parcela?.identificador}</SheetTitle>
          <SheetDescription>{parcela?.ranchoNombre}</SheetDescription>
        </SheetHeader>
        {parcela && (
          <div className="flex flex-col gap-4 px-4">
            <div className="flex items-center gap-2">
              <StatusBadge estado={parcela.estado} />
              <span className="text-sm text-muted-foreground tabular-nums">
                {parcela.superficieM2.toLocaleString("es-MX")} m²
              </span>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Costo acumulado</p>
              <p className="text-2xl font-semibold tabular-nums">
                {currency(parcela.costoTotal)}
              </p>
            </div>
            {!parcela.geometria && (
              <p className="text-sm text-muted-foreground">
                Esta parcela aún no tiene límites dibujados.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Página /dashboard/mapa**

Create `src/app/dashboard/mapa/page.tsx`:

```tsx
import dynamic from "next/dynamic"
import { PageHeader } from "@/presentation/components/page-header"
import { loadParcelasMapa } from "@/presentation/geo-queries"

const FieldMap = dynamic(
  () => import("@/presentation/components/field-map").then((m) => m.FieldMap),
  { ssr: false, loading: () => <div className="h-[70vh] rounded-lg border border-border" /> },
)

export default async function MapaPage() {
  const parcelas = await loadParcelasMapa()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        badge="Análisis"
        title="Mapa de parcelas"
        description="Vista satelital de las parcelas. Haz clic en una para ver sus costos; usa Editar límites para dibujar su polígono."
      />
      <FieldMap parcelas={parcelas} />
    </div>
  )
}
```

Nota: en Next 16 con App Router, `dynamic(..., { ssr:false })` debe usarse en un componente cliente; si la página server lo rechaza, crear `field-map-loader.tsx` (`"use client"`) que haga el dynamic import y renderizar ese loader desde la página server.

- [ ] **Step 3: Entrada "Mapa" en el sidebar**

En `src/presentation/components/sidebar-nav.tsx`, importar `MapIcon` (usar `Map` ya importado o `MapPinned`) y agregar al arreglo `TOOLS`:

```tsx
  { slug: "mapa", title: "Mapa de parcelas", icon: MapPinned },
```

Agregar `MapPinned` al import de lucide-react.

- [ ] **Step 4: Reservar el slug en la ruta CRUD genérica**

En `src/app/dashboard/[slug]/page.tsx`, agregar `"mapa"` al set `RESERVED`:

```ts
const RESERVED = new Set(["kardex", "costeo", "trazabilidad", "reportes", "mapa"])
```

- [ ] **Step 5: Verificar**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.
Carga `http://localhost:3000/dashboard/mapa` → 200; mapa satelital con 6 polígonos; click → panel con costo.

- [ ] **Step 6: Checkpoint** — mapa navegable con detalle.

---

### Task 6: Dibujar / editar / guardar geometría (terra-draw)

**Files:**
- Modify: `src/presentation/components/field-map.tsx`

**Interfaces:**
- Consumes: `terra-draw` + adapter MapLibre (confirmado en Task 1), `saveParcelaGeometria` (Task 3).

- [ ] **Step 1: Añadir modo edición**

En `field-map.tsx`, agregar estado `editing` + instancia terra-draw enlazada al mapa. Botón "Editar límites" inicia el modo polígono; "Guardar" toma el polígono dibujado (`draw.getSnapshot()` → primer Feature Polygon), llama `saveParcelaGeometria(selected.id, geometria)` dentro de `startTransition`, muestra toast, y refresca la fuente `parcelas` con `(map.getSource('parcelas') as GeoJSONSource).setData(fc(updated))`. Usar la API exacta de terra-draw confirmada en Task 1 (constructor, `start()`, `setMode("polygon")`, evento `finish`, `getSnapshot()`).

Requiere una parcela seleccionada (se edita el polígono de `selected`). Tras guardar, salir de modo edición (`draw.stop()`).

- [ ] **Step 2: Verificar tipos + flujo**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.
En `/dashboard/mapa`: seleccionar parcela → Editar límites → dibujar polígono → Guardar → toast de éxito; recargar la página muestra el nuevo polígono.

- [ ] **Step 3: Checkpoint** — captura/edición de geometría funcionando.

---

### Task 7: Verificación global

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 2: Rutas**

Cargar (200 + sin `__next_error__`): `/dashboard/mapa`, `/dashboard` (sidebar con "Mapa"), `/dashboard/parcelas`, `/dashboard/costeo`, `/dashboard/kardex`.

- [ ] **Step 3: Revisión a ojo en /dashboard/mapa**

Base satelital, 6 polígonos coloreados por estado, toggle satélite/calle, click→panel con costo real, Editar límites → dibujar → guardar persiste.

- [ ] **Step 4: Checkpoint final** — subsistema mapa completo.

---

## Self-Review

- **Spec coverage:** stack mapcn/MapLibre (T1) ✓; campo geometria + seed (T2) ✓; action+query (T3) ✓; satélite Esri + polígonos por estado + selección (T4) ✓; panel detalle + página + sidebar + slug reservado (T5) ✓; dibujar/editar/guardar terra-draw (T6) ✓; verificación + rutas intactas (T7) ✓; sin API keys (T1/T4) ✓; geometría solo parcela (T2) ✓.
- **Placeholder scan:** los puntos marcados "confirmar en Task 1" (API exacta de mapcn/terra-draw) son contratos de dependencias externas que se leen del paquete instalado, no placeholders de lógica; el código de maplibre-gl (addSource/addLayer/click) está completo y es API conocida.
- **Type consistency:** `ParcelaMapa` (T3) usado igual en T4/T5; `GeoPolygon` (T2) usado en T3/entidad; `saveParcelaGeometria(parcelaId, geometria)` firma consistente T3↔T6; `loadParcelasMapa` retorno consistente T3↔T5.
