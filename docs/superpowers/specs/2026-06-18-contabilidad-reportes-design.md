# Suite de reportes — Contabilidad (CxP) — Gestión agrícola

**Fecha:** 2026-06-18
**Estado:** Aprobado por usuario, listo para plan de implementación

## Objetivo

Convertir la página de Reportes en un **hub** con framework de reportes
reutilizable, y entregar el primer lote: **contabilidad de cuentas por pagar**
(antigüedad de saldos, estado de cuenta por proveedor, egresos por periodo),
más el reporte de inventario migrado al framework. Cada reporte se ve en
pantalla con filtros y se descarga como PDF branded.

## Alcance / no-alcance

- **Dentro:** framework PDF reutilizable; hub catálogo con filtros (rango de
  fechas, proveedor) + vista en pantalla + descarga PDF; 3 reportes contables +
  inventario migrado.
- **Fuera (YAGNI):** reportes operativos (costeo/kardex/producción/compras →
  specs siguientes); asientos contables / balance general / catálogo de cuentas;
  conciliación bancaria; pagos parciales; generación en servidor.

## Supuestos contables (explícitos)

No existen fecha ni monto de pago en el modelo (solo `estado`:
pendiente/pagada/vencida). Por lo tanto:
- "pagada" = cuenta saldada (excluida de saldos por cobrar/aging).
- El egreso se fecha por **generación de la cuenta** (`createdAt`).
- Vencimiento = `fechaVencimiento`. "Vencido" = no pagada con
  `fechaVencimiento < hoy`.

## Lógica (helpers puros, client-safe)

`src/lib/accounting.ts` — funciones puras sobre `CuentaPorPagar[]` +
`{id,razonSocial}[]`, sin acceso a fs (usables en server y cliente):
- `aging(cxps, proveedores, hoy): AgingReporte` con buckets
  **Por vencer / 1–30 / 31–60 / 61–90 / +90** (solo no pagadas), filas por
  proveedor `{ proveedor, porVencer, d1_30, d31_60, d61_90, d90, total }`,
  y totales por bucket + total general.
- `estadoCuenta(cxps, proveedores, proveedorId): EstadoCuentaReporte` →
  `{ proveedor, filas: { factura, fecha, vencimiento, importe, estado }[],
  totales: { facturado, pagado, pendiente, vencido } }`.
- `egresosPorMes(cxps): EgresoMes[]` → `{ mes, pagado, pendiente, total }[]`
  ordenado por mes.
- `filtrarPorFecha(cxps, desde?, hasta?)` por `createdAt` (YYYY-MM-DD).

## Framework PDF reutilizable

`src/presentation/components/reports/report-shell.tsx`:
- `ReportDocument({ titulo, subtitulo, generadoEl, filtros?, children })` →
  `Document`+`Page` A4 con header (logo piña + título + subtítulo + generado +
  línea de filtros aplicados) y footer (marca + "Página X de Y").
- `ReportKpis({ items: { label, value }[] })`.
- `ReportTable({ columns: { key, label, align?, width? }[], rows, total? })`.
- `ReportSection({ titulo, children })`.
Reusa los estilos/logo del PDF actual (DRY). El reporte de inventario se
**migra** a este shell.

## Reportes (4) — cada uno: vista HTML en pantalla + documento PDF

1. **Antigüedad de saldos (aging)** — buckets + tabla por proveedor.
2. **Estado de cuenta por proveedor** — filas + totales (requiere proveedor).
3. **Egresos por periodo** — importe por mes (pagado/pendiente).
4. **Inventario valorizado** — migrado al framework.

## Hub `/dashboard/reportes`

- `reportes/page.tsx` (server): carga `cuentasPorPagar`, `proveedores`,
  `existencias` (inventario) y los pasa como props serializables al hub.
- `reportes-hub.tsx` (cliente): catálogo de tarjetas (icono + nombre +
  descripción) a la izquierda; al seleccionar, panel con **filtros**
  contextuales (rango de fechas, proveedor) + **vista HTML** del reporte +
  botón **"Descargar PDF"** (carga react-pdf por import dinámico).
- Vistas HTML: `reports/aging-view.tsx`, `estado-cuenta-view.tsx`,
  `egresos-view.tsx`, `inventario-view.tsx` (reusan Card/Table/StatCard/StatusBadge).

## Flujo de datos

Server carga datos crudos → hub cliente computa con `lib/accounting.ts` según
filtros (volúmenes chicos, todo en cliente) → renderiza vista HTML y, al click,
arma los props del documento PDF y descarga el blob. Sin red ni servidor para
generar.

## Archivos

- `src/lib/accounting.ts` (+ tipos)
- `src/presentation/geo-queries.ts`-style: `src/presentation/reports-queries.ts`
  (`loadReportesContext()`)
- `src/presentation/components/reports/report-shell.tsx`
- `.../reports/report-doc-inventario.tsx`, `report-doc-aging.tsx`,
  `report-doc-estado-cuenta.tsx`, `report-doc-egresos.tsx`
- `.../reports/aging-view.tsx`, `estado-cuenta-view.tsx`, `egresos-view.tsx`,
  `inventario-view.tsx`
- `.../reports/download-report-button.tsx` (genérico, recibe el doc a generar)
- `src/app/dashboard/reportes/page.tsx` (rehecho) + `reportes-hub.tsx`
- Se elimina/migra `report-pdf.tsx` y `download-report-button.tsx` actuales hacia
  `reports/`.

## Criterios de éxito

1. `/dashboard/reportes` muestra catálogo; cada reporte se ve en pantalla con sus
   filtros y descarga un PDF branded correcto con datos reales.
2. Aging agrupa correctamente por antigüedad; estado de cuenta cuadra
   facturado = pagado + pendiente + vencido; egresos por mes suma correcto.
3. `tsc --noEmit` = 0; ruta 200; @react-pdf sigue lazy.
4. Sin tocar dominio/PEPS/datastore; sin API keys.
