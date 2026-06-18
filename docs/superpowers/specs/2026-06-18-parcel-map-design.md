# Subsistema "Mapa de parcelas" — AgroPiña

**Fecha:** 2026-06-18
**Estado:** Aprobado por usuario, listo para plan de implementación

## Objetivo

Agregar un mapa geoespacial real: base satelital + polígonos de parcela
coloreados por estado, click → panel de detalle con costos reales, y
dibujar/editar/guardar los límites de cada parcela. Eleva la experiencia hacia
el look de las referencias (agricultura de precisión) usando solo datos reales.

## Alcance y no-alcance

- **Dentro:** mapa, capa satelital, polígonos de parcela, selección + panel de
  detalle, dibujo/edición de geometría a nivel parcela, seed de polígonos demo.
- **Fuera (YAGNI):** NDVI, clima, analítica/score satelital, geometría a nivel
  plantilla, routing/arcs, edición multiusuario en vivo. Estos son de pago o
  subsistemas aparte.

## Stack

- **mapcn** (`pnpm dlx shadcn@latest add @mapcn/map`) → instala `maplibre-gl` +
  `components/ui/map.tsx` (copy-paste, propio). Tiles CARTO gratis, light/dark
  auto, expone la instancia MapLibre cruda.
- Sobre la instancia cruda: raster **Esri World Imagery** (satélite gratis, sin
  API key, requiere atribución) como base, con toggle a CARTO (calle).
- **Polígonos** = capa GeoJSON MapLibre (fill + line), color por estado.
- **terra-draw** (adapter MapLibre) para dibujar/editar geometría.
- Cliente puro: `dynamic(() => import(...), { ssr: false })` (MapLibre usa
  `window`).

## Modelo de datos (cambio aditivo, migración-segura)

- Agregar a `Parcela` (dominio) campo opcional:
  `geometria?: { type: "Polygon"; coordinates: number[][][] } | null`.
- Registros existentes sin `geometria` siguen válidos (campo opcional).
- El campo NO se agrega a `modules.ts` (el form genérico no edita geometría; se
  edita en el mapa).

## Componentes y archivos

- Ruta `src/app/dashboard/mapa/page.tsx` (server): carga parcelas con geometría,
  nombre de rancho, estado y resumen de costos por parcela.
- `src/presentation/components/field-map.tsx` (cliente, cargado vía `dynamic`
  ssr:false): mapa MapLibre (mapcn) + raster satelital + capa GeoJSON de
  parcelas + estado de selección + modo edición (terra-draw) + toggle de capa.
- `src/presentation/components/parcela-detail-panel.tsx` (cliente): contenido
  del `Sheet`/Drawer para la parcela seleccionada — nombre, rancho, estado
  (badge), superficie, costos acumulados, ciclos y siembras.
- `src/presentation/actions/geo-actions.ts` (server action):
  `saveParcelaGeometria(parcelaId: string, geometria: GeoJSONPolygon | null)`
  → `crudService("parcelas").update(...)` + `revalidatePath("/dashboard/mapa")`.
- `src/presentation/queries.ts` (o nuevo `geo-queries.ts`): `loadParcelasMapa()`
  → `{ id, identificador, ranchoNombre, estado, superficieM2, geometria,
  costoTotal }[]`.
- Sidebar: entrada **"Mapa"** (`/dashboard/mapa`) en el grupo Análisis.

## Flujo de datos

Server component carga parcelas + costos (vía servicios existentes:
`costingService.resumenPorNivel("parcelaId")`, repos de ranchos/ciclos/siembras).
Pasa props serializables al `FieldMap` cliente. La edición de geometría es
dibujo en cliente → al guardar llama el server action → actualiza datastore →
`revalidatePath`.

## Seed

Extender el generador `scripts/seed-rich.mjs`: agregar `geometria` (Polygon
demo) a las 6 parcelas, ubicadas cerca de Veracruz/Loma Bonita (zona piñera,
coherente con los lada 229/271/287 de los proveedores). Polígonos pequeños y
separados. Editables/reemplazables dibujando. Escribe a `seed.json` +
`.data/database.json`.

## Riesgos / notas técnicas

- MapLibre y terra-draw son client-only → import dinámico `ssr:false`;
  envoltura con estado de "montado" para evitar mismatch de hidratación.
- React 19 / Next 16: mapcn instala su propio wrapper; si el wrapper no soporta
  React 19, caer a uso directo de `maplibre-gl` dentro de `field-map.tsx`
  (la instancia cruda es lo que usamos de todos modos).
- Esri World Imagery: añadir atribución en el mapa.
- `next.config.mjs`: si hace falta, permitir el paquete maplibre en transpile;
  verificar en build.

## Criterios de éxito

1. `/dashboard/mapa` muestra base satelital + polígonos de las parcelas con
   geometría, coloreados por estado.
2. Click en parcela → panel lateral con sus datos y costos reales.
3. Modo "Editar límites": dibujar/ajustar polígono y guardar persiste el GeoJSON
   en la parcela (visible al recargar).
4. Toggle satélite/calle funciona.
5. `tsc --noEmit` = 0; `/dashboard/mapa` carga 200; rutas previas intactas.
6. Sin API keys ni dependencias de pago. Sin tocar PEPS/costeo/datastore core.
