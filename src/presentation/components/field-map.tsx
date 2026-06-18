"use client"

import type {
  GeoJSONSource,
  MapLayerMouseEvent,
  StyleSpecification,
} from "maplibre-gl"
import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { TerraDraw, TerraDrawPolygonMode } from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import { Pencil, Save, X } from "lucide-react"
import { Map, MapControls, type MapRef, useMap } from "@/components/ui/map"
import { Button } from "@/components/ui/button"
import type { GeoPolygon } from "@/core/domain/entities"
import { saveParcelaGeometria } from "@/presentation/actions/geo-actions"
import type { ParcelaMapa } from "@/presentation/geo-queries"
import { ParcelaDetailPanel } from "./parcela-detail-panel"

const ESRI =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: [ESRI],
      tileSize: 256,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "esri-base", type: "raster", source: "esri" }],
}
const STREET_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"

const SOURCE_ID = "parcelas"

function toFeatureCollection(parcelas: ParcelaMapa[]) {
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

function boundsOf(
  parcelas: ParcelaMapa[],
): [[number, number], [number, number]] | null {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity
  for (const p of parcelas) {
    if (!p.geometria) continue
    for (const ring of p.geometria.coordinates) {
      for (const [x, y] of ring) {
        if (x < minx) minx = x
        if (y < miny) miny = y
        if (x > maxx) maxx = x
        if (y > maxy) maxy = y
      }
    }
  }
  if (minx === Infinity) return null
  return [
    [minx, miny],
    [maxx, maxy],
  ]
}

/** Adds the parcela polygons (fill + line) onto the raw MapLibre instance. */
function ParcelLayer({
  parcelas,
  selectedId,
  onSelect,
}: {
  parcelas: ParcelaMapa[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!isLoaded || !map) return

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: toFeatureCollection(parcelas),
    })
    map.addLayer({
      id: "parcelas-fill",
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": ["match", ["get", "estado"], "activo", "#34d399", "#f59e0b"],
        "fill-opacity": 0.35,
      },
    })
    map.addLayer({
      id: "parcelas-line",
      type: "line",
      source: SOURCE_ID,
      paint: { "line-color": "#10b981", "line-width": 2 },
    })
    map.addLayer({
      id: "parcelas-selected",
      type: "line",
      source: SOURCE_ID,
      paint: { "line-color": "#a3e635", "line-width": 4 },
      filter: ["==", ["get", "id"], "__none__"],
    })

    const onClick = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as string | undefined
      if (id) onSelect(id)
    }
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer"
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ""
    }
    map.on("click", "parcelas-fill", onClick)
    map.on("mouseenter", "parcelas-fill", onEnter)
    map.on("mouseleave", "parcelas-fill", onLeave)

    const b = boundsOf(parcelas)
    if (b) map.fitBounds(b, { padding: 60, duration: 0, maxZoom: 15 })

    return () => {
      // The map may already be removed (navigation/style swap): its internal
      // style is gone and getLayer/removeLayer throw. Guard like mapcn does.
      try {
        map.off("click", "parcelas-fill", onClick)
        map.off("mouseenter", "parcelas-fill", onEnter)
        map.off("mouseleave", "parcelas-fill", onLeave)
        if (!map.getStyle()) return
        for (const id of [
          "parcelas-selected",
          "parcelas-line",
          "parcelas-fill",
        ]) {
          if (map.getLayer(id)) map.removeLayer(id)
        }
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // map already torn down — nothing to clean.
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map])

  useEffect(() => {
    if (!isLoaded || !map) return
    try {
      const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
      src?.setData(toFeatureCollection(parcelas))
    } catch {
      // map torn down between renders.
    }
  }, [isLoaded, map, parcelas])

  useEffect(() => {
    if (!isLoaded || !map) return
    try {
      if (!map.getLayer("parcelas-selected")) return
      map.setFilter("parcelas-selected", [
        "==",
        ["get", "id"],
        selectedId ?? "__none__",
      ])
    } catch {
      // map torn down between renders.
    }
  }, [isLoaded, map, selectedId])

  return null
}

export function FieldMap({ parcelas: initial }: { parcelas: ParcelaMapa[] }) {
  const [parcelas, setParcelas] = useState(initial)
  const [satellite, setSatellite] = useState(true)
  const [selected, setSelected] = useState<ParcelaMapa | null>(null)
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const mapRef = useRef<MapRef>(null)
  const drawRef = useRef<TerraDraw | null>(null)

  const style = satellite ? SATELLITE_STYLE : STREET_STYLE
  const first = parcelas.find((p) => p.geometria)
  const center = (first?.geometria?.coordinates[0][0] as [number, number]) ?? [
    -95.87, 18.1,
  ]

  function startEditing() {
    const map = mapRef.current
    if (!map || !selected) return
    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [new TerraDrawPolygonMode()],
    })
    draw.start()
    draw.setMode("polygon")
    drawRef.current = draw
    setEditing(true)
  }

  function stopEditing() {
    drawRef.current?.stop()
    drawRef.current = null
    setEditing(false)
  }

  function saveEditing() {
    const draw = drawRef.current
    if (!draw || !selected) return
    const poly = draw
      .getSnapshot()
      .find((f) => f.geometry.type === "Polygon")
    if (!poly) {
      toast.error("Dibuja un polígono antes de guardar.")
      return
    }
    const geometria: GeoPolygon = {
      type: "Polygon",
      coordinates: poly.geometry.coordinates as number[][][],
    }
    startTransition(async () => {
      const res = await saveParcelaGeometria(selected.id, geometria)
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo guardar")
        return
      }
      setParcelas((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...p, geometria } : p)),
      )
      toast.success("Límites guardados")
      stopEditing()
    })
  }

  // Clean up any draw session on unmount.
  useEffect(() => {
    return () => {
      drawRef.current?.stop()
      drawRef.current = null
    }
  }, [])

  const panelOpen = !!selected && !editing

  return (
    <div className="relative h-[72vh] overflow-hidden rounded-lg border border-border">
      <Map
        ref={mapRef}
        theme="light"
        styles={{ light: style, dark: style }}
        center={center}
        zoom={13}
        className="size-full"
      >
        <MapControls position="top-right" showZoom showFullscreen />
        <ParcelLayer
          parcelas={parcelas}
          selectedId={selected?.id ?? null}
          onSelect={(id) =>
            setSelected(parcelas.find((p) => p.id === id) ?? null)
          }
        />
      </Map>

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

      {/* Edit controls */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
        {editing ? (
          <>
            <span className="rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
              Dibuja el polígono de {selected?.identificador} y guarda
            </span>
            <Button size="sm" onClick={saveEditing} disabled={pending}>
              <Save className="size-4" /> Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={stopEditing}>
              <X className="size-4" /> Cancelar
            </Button>
          </>
        ) : (
          selected && (
            <Button size="sm" variant="secondary" onClick={startEditing}>
              <Pencil className="size-4" /> Editar límites de{" "}
              {selected.identificador}
            </Button>
          )
        )}
      </div>

      <ParcelaDetailPanel
        parcela={panelOpen ? selected : null}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
