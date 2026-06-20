# Reportes operativos (lote 2) — Gestión agrícola

**Fecha:** 2026-06-18
**Estado:** Aprobado por usuario ("haz todo eso"), listo para plan.

## Objetivo

Agregar 5 reportes al hub existente, reusando el framework (`report-shell` +
vista HTML + entrada de catálogo): Costeo por nivel, Costo de semillero, Kardex
PEPS, Órdenes de compra, Producción de plantas.

## Reportes y datos (todos con servicio/dato existente)

1. **Costeo por nivel** — `costingService.resumenPorNivel(nivel)` para los 4
   niveles (rancho/parcela/plantilla/ciclo); labels vía `loadLabelMap`.
   Filtro: selector de nivel. Columnas: concepto, mano de obra, insumos, total.
2. **Costo de planta de semillero** — `costingService.costoSemilla()`
   (costoTotal, plantasProducidas, costoUnitario); label = parcela del semillero.
   Sin filtro. Columnas: semillero, costo total, plantas, costo unitario.
3. **Kardex PEPS por producto** — `inventoryService.kardex(productoId)` para
   cada producto. Filtro: selector de producto. Columnas: fecha, tipo, cantidad,
   costo unitario, importe, saldo cant., saldo valor.
4. **Órdenes de compra** — `ordenesCompra` + proveedor + total (de `detalles`).
   Filtros: estado, proveedor, rango de fechas (por `fecha`). Columnas: folio,
   fecha, proveedor, estado, total.
5. **Producción de plantas** — sembradas (`siembras.cantidadPlantas` por mes) +
   producidas (`semilleros.plantasProducidas` por mes de `fechaProduccion`).
   Filtro: rango de fechas (por mes). Columnas: mes, sembradas, producidas.

## Carga de datos (server)

Extender `loadReportesContext()` para incluir, además de lo contable:
- `costeo: { nivel: "ranchoId"|"parcelaId"|"plantillaId"|"cicloId"; titulo: string; filas: { concepto: string; manoObra: number; insumos: number; total: number }[] }[]`
- `semilleros: { semillero: string; costoTotal: number; plantas: number; costoUnitario: number }[]`
- `kardex: { productoId: string; producto: string; filas: KardexRow[] }[]`
- `ordenes: { folio: string; fecha: string; proveedor: string; estado: string; total: number }[]`
- `produccion: { mes: string; sembradas: number; producidas: number }[]`
Labels resueltos en server. Todo serializable. Volúmenes chicos (seed).

## Componentes (por reporte)

Por cada reporte: una vista HTML (`reports/<x>-view.tsx`) y un documento PDF
(`reports/report-doc-<x>.tsx`) compuesto con `report-shell`. El hub
(`reportes-hub.tsx`) añade 5 entradas de catálogo, sus filtros contextuales
(nivel, producto, estado/proveedor) y el branch de impresión por reporte.

## Filtros en el hub

- Rango de fechas (existente): aplica a órdenes (por `fecha`) y producción
  (por mes); ignorado por costeo/semillero/kardex.
- Proveedor (existente): aplica a estado de cuenta y órdenes.
- Nuevos selectores contextuales: **nivel** (costeo), **producto** (kardex),
  **estado de orden** (órdenes).

## Fuera de alcance (YAGNI)

Reportes no listados (mano de obra por cuadrilla, costo por m², seguimiento de
requerimientos, calendario de pagos, etc.) → lotes siguientes. Sin cambios a
dominio/servicios core (solo lectura/composición).

## Criterios de éxito

1. El hub muestra 9 reportes (4 previos + 5 nuevos); cada nuevo se ve en
   pantalla con sus filtros y se imprime con PDF branded correcto.
2. Costeo cuadra (manoObra+insumos=total); kardex muestra saldos; órdenes suma
   total de detalles; producción suma por mes.
3. `tsc --noEmit` = 0; `/dashboard/reportes` 200; @react-pdf sigue lazy.
4. Sin tocar dominio/PEPS/datastore.
