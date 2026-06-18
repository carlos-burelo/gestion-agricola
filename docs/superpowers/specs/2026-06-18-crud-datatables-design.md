# Vistas CRUD vivas + datatables — AgroPiña

**Fecha:** 2026-06-18
**Estado:** Aprobado por usuario, listo para plan de implementación

## Objetivo

Las ~18 vistas CRUD hoy son tablas planas ("parecen Excel"). Darles vida sin
perder la funcionalidad de tabla: filas ricas (badges, jerarquía, números
tabulares), una tira de KPIs por página, y superpoderes de datatable
(orden, búsqueda, filtros, paginación). Solo capa de presentación. No se tocan
dominio, servicios ni datastore.

## Contexto técnico

- Tabla genérica dirigida por `src/presentation/config/modules.ts`
  (`config.fields`). Un solo componente `record-table.tsx` (cliente) renderiza
  todos los módulos vía `[slug]/page.tsx`.
- `formatCell` actual: reference→label, number→moneda/numero, boolean→Sí/No.
- Acciones por fila: editar/eliminar vía `RecordForm` + `deleteRecord` action.
- Ya existen: `StatCard`, `StatusBadge`, `EmptyState`, `SectionHeader`,
  `chart-card`. shadcn base = base-ui. Tailwind 4.

## Decisiones tomadas

- **Dirección:** tablas vivas + tira de KPIs (reusa `StatCard`) + superpoderes.
- **Datatable:** TanStack Table (`@tanstack/react-table`), headless, sobre la
  `Table` shadcn existente. Única dependencia nueva.
- **Cómputo:** sort/búsqueda/filtros/paginación 100% en cliente sobre el array
  ya cargado server-side (volúmenes chicos, sin fetch adicional).

## Componentes

### `record-stats.tsx` (nuevo)
Tira de hasta 4 KPIs genéricos calculados de los registros, reusando `StatCard`:
1. **Total** de registros (`{n} {config.title}`).
2. **Σ del primer campo dinero** (`name` incluye costo/importe/precio/valor) si
   existe → moneda MXN.
3. **Conteo del estado primario** si hay campo `select` llamado `estado` →
   cuenta de su primera opción (ej. "Activos").
4. **Distintos del primer campo `reference`** (ej. proveedores distintos).
Reglas degradables: si un KPI no aplica, se omite (no se rellena con ceros).
Recibe `config` + `records` + `labelMap`; sin estado, render server o cliente.

### `record-cells.tsx` (nuevo)
Renderers de celda por tipo, extraídos para mantener `record-table.tsx`
enfocado:
- `select` (estado/tipo/esSemillero) → `StatusBadge` (color por valor).
- `reference` → chip sutil (texto sobre `bg-muted`).
- `number` dinero → moneda MXN alineada derecha + `tabular-nums`; otros números
  `tabular-nums`.
- `date` → `dd MMM yy` (Intl es-MX).
- `boolean`/`esSemillero` → Sí/No (badge).
- fallback → texto; primera columna texto/reference con `font-medium`.

### `record-table.tsx` (reescrito sobre TanStack)
- Columnas generadas de `config.fields` (no `hideInTable`) + columna Acciones.
- `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`,
  `getPaginationRowModel`, `getFacetedRowModel`.
- **Orden:** header clickeable con indicador ▲▼ (`ArrowUp/ArrowDown/ChevronsUpDown`).
- **Búsqueda global:** `globalFilter` con input + icono `Search`.
- **Filtros por columna:** para cada campo `select`, un `Select` shadcn
  ("Todos" + opciones) que setea `columnFilters`.
- **Paginación:** tamaños 10/25/50, controles prev/next, texto "x–y de z".
- **Toolbar:** búsqueda a la izquierda; filtros + botón "Limpiar" (cuando hay
  filtros) + "Nuevo {singular}" a la derecha.
- **Acciones:** columna no ordenable/no filtrable; reusa `RecordForm`
  (editar) + `deleteRecord` (con `confirm` + toast) tal como hoy.
- **Vacío:** `EmptyState` cuando no hay filas (y mensaje distinto cuando el
  filtro no arroja resultados).
- Hover de fila, bordes suaves, contenedor `rounded-lg border bg-card`.

### `status-badge.tsx` (extender)
Agregar tonos: `borrador`, `autorizada`, `parcial`, `cotizada`, `comprada`,
`true`/`false` (para esSemillero). Reusa el patrón actual.

## Flujo de datos

`[slug]/page.tsx` (server) carga `records`, `referenceOptions`, `labelMap`
(igual que hoy) → renderiza `<RecordStats/>` + `<RecordTable/>`. Toda la
interactividad (sort/filtro/búsqueda/página) vive en el cliente vía TanStack;
las mutaciones siguen usando server actions existentes.

## Fuera de alcance (YAGNI)

- Sin paginación server-side, export CSV, selector de visibilidad de columnas ni
  multi-orden.
- Vista de tarjetas descartada (se eligió mantener tabla).
- Páginas de análisis (dashboard, costeo, kardex, trazabilidad, reportes) no
  cambian.
- Sin cambios a dominio, servicios, PEPS ni datastore.

## Criterios de éxito

1. Cada página CRUD muestra tira de KPIs + tabla con orden, búsqueda global,
   filtros por estado y paginación, funcionando con los datos actuales.
2. Filas con badges de estado, chips de referencia y montos alineados/tabulares.
3. Editar/eliminar siguen funcionando vía los server actions existentes.
4. `tsc --noEmit` = 0; todas las rutas CRUD cargan 200 sin error overlay.
5. Arquitectura preservada: tabla sigue dirigida por config; lógica en cliente,
   datos vía servicios.
