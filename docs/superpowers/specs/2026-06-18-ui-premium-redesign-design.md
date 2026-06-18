# Rediseño estético premium — AgroPiña

**Fecha:** 2026-06-18
**Estado:** Aprobado por usuario, listo para plan de implementación

## Objetivo

Elevar la estética del sistema de gestión agrícola (producción de piña) de
"funcional básico" a un nivel premium, con gráficas y una UI profesional.
El sistema ya es funcional; este trabajo es exclusivamente de capa de
presentación. **No** se tocan reglas de negocio, PEPS, dominio ni datastore.

## Contexto técnico

- Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, TypeScript.
- shadcn (estilo `base-nova`), tokens en `src/app/globals.css` (paleta verde ya
  definida, incluye `--chart-1..5`).
- Arquitectura limpia: `core/domain`, `core/application` (services),
  `infrastructure` (JSON datastore), `presentation` (components/actions/config).
- UI maneja módulos de forma declarativa vía `presentation/config/modules.ts`.
- Datastore JSON en `.data/database.json` con datos semilla reales.

## Decisiones tomadas

- **Alcance:** Dashboard + páginas de análisis (Costeo, Kardex, Trazabilidad,
  Reportes) reciben gráficas ricas. Componentes compartidos pulidos elevan las
  ~18 páginas CRUD genéricas sin rediseño individual.
- **Dirección visual:** Enterprise claro + acento verde piña. Modo oscuro
  rebrandeado (hoy es gris plano) para que también se vea premium.
- **Librería de gráficas:** shadcn Charts sobre **Recharts** (única dependencia
  nueva). Integra con los tokens `--chart-*` existentes.

## Sistema visual

- Conservar y extender la paleta verde existente. Añadir elevación/sombras
  sutiles (`shadow-xs/sm`), aprovechar la escala de radios ya definida.
- Reescribir el bloque `.dark` de `globals.css` con acentos verdes (charts y
  primary), en lugar del gris actual.
- Jerarquía tipográfica más marcada: números KPI grandes, `tabular-nums` para
  alinear cifras monetarias.

## Componentes nuevos (`src/presentation/components/`)

| Componente | Responsabilidad |
|---|---|
| `stat-card.tsx` | KPI grande + delta ▲▼ vs periodo previo + mini-sparkline |
| `chart-card.tsx` | Contenedor estándar de gráfica (título, subtítulo, leyenda, estado vacío) |
| `section-header.tsx` | Encabezado de sección consistente |
| `status-badge.tsx` | Badge de estado con color semántico (activo/cerrado/vencida…) |
| `empty-state.tsx` | Estado vacío elegante (gráficas degradan sin datos) |
| `charts/` | Gráficas cliente concretas (área, donut, barras, línea, timeline) |

Más el primitivo oficial shadcn `src/components/ui/chart.tsx` (ChartContainer,
ChartTooltip, ChartLegend).

## Gráficas y origen de datos (todas con datos reales)

| Gráfica | Tipo | Fuente (capa application) |
|---|---|---|
| Costos por mes (mano obra vs insumos) | Área apilada | `registrosActividad.costo` + `valesSalida.detalles` por `fecha` |
| Mezcla de costos | Donut | `resumenPorNivel` (mano obra/insumos) + semilleros (maquinaria) |
| Top productos por valor | Barras horizontales | `inventoryService.existencias()` → `valorInventario` |
| Plantas sembradas por mes | Línea | `siembras.cantidadPlantas` por `fecha` |
| Costeo por nivel | Barras apiladas | `costingService.resumenPorNivel(nivel)` |
| Saldo-valor de inventario en el tiempo | Área | `inventoryService.kardex()` → `saldoImporte` por `fecha` |
| Trazabilidad | Timeline vertical | `traceability-service` (cadena de eventos) |

Se agregarán 2-3 métodos de **agregación temporal** a los services existentes
(ej. `costosPorMes()`), respetando la separación de capas. El dominio no cambia.

## Páginas

- **Dashboard (`/dashboard`):** fila de 4 KPIs con tendencia + sparkline;
  gráficas área (costos/mes), donut (mezcla), barras (top productos), línea
  (plantas sembradas); accesos rápidos refinados.
- **Costeo:** barras apiladas por nivel (tabs) + tablas actuales pulidas.
- **Kardex:** área saldo-valor + tabla PEPS con badges entrada/salida.
- **Trazabilidad:** timeline visual vertical en lugar de texto plano.
- **Reportes:** tarjetas-resumen + mini gráficas por categoría.

## Flujo de datos

Server components siguen cargando datos vía services → pasan props serializables
a componentes cliente de gráficas (`"use client"` + Recharts). Sin fetching en
cliente; sin cambios al modelo de persistencia.

## Fuera de alcance (YAGNI)

- No tocar lógica de negocio, PEPS, dominio ni `.data`.
- No rediseñar cada CRUD individual (heredan el polish de componentes compartidos).
- Sin librerías nuevas salvo `recharts`.
- Sin autenticación, i18n, ni nuevas entidades.

## Criterios de éxito

1. Dashboard y páginas de análisis muestran gráficas funcionando con los datos
   semilla actuales, degradando con elegancia cuando no hay datos.
2. Look consistente y premium (claro + oscuro) en todas las páginas.
3. Cero regresión funcional: build pasa, todas las rutas cargan 200.
4. Arquitectura limpia preservada (lógica en services, UI en presentation).
