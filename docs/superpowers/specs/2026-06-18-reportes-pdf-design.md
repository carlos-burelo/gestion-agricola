# Reportes en PDF — AgroPiña

**Fecha:** 2026-06-18
**Estado:** Aprobado por usuario, listo para plan de implementación

## Objetivo

Permitir descargar la página de Reportes como un PDF profesional y branded
(logo piña, fecha, KPIs, tablas con totales) generado en el cliente, sin
servidor ni dependencias de pago.

## Alcance

- **Dentro:** botón "Descargar PDF" en `/dashboard/reportes` que genera un PDF
  con: header branded, KPIs (valor total, productos, unidades), tabla de
  inventario valorizado (PEPS) con fila total, tabla Top productos por valor,
  footer con paginación.
- **Fuera (YAGNI):** PDF de Costeo/Kardex/Trazabilidad (después; este define el
  patrón), generación en servidor, gráficas rasterizadas (se usan tablas),
  export de tablas CRUD.

## Stack

- `@react-pdf/renderer` (cliente). Es pesado → se carga con **import dinámico al
  hacer click**, fuera del bundle inicial.
- Logo piña dibujado con los primitivos `Svg`/`Path` de @react-pdf (reusa los
  paths de `public/icon.svg`), no imagen externa.

## Componentes y archivos

- `src/presentation/components/report-pdf.tsx` (cliente): define el documento
  `<ReporteInventarioDoc data={...} />` con react-pdf (`Document`, `Page`,
  `View`, `Text`, `Svg`, `Path`, `StyleSheet`). A4 vertical. Moneda MXN.
  Recibe props serializables:
  `ReportePDFData = { generadoEl: string; valorTotal: number;
  totalProductos: number; unidadesTotal: number;
  filas: { producto: string; existencia: number; costoPromedio: number;
  valorInventario: number }[]; top: { nombre: string; valor: number }[] }`.
- `src/presentation/components/download-report-button.tsx` (cliente): botón que
  al click hace `const { pdf } = await import("@react-pdf/renderer")` +
  importa el doc, genera `await pdf(<Doc/>).toBlob()`, y dispara descarga
  `Reporte-inventario-<fecha>.pdf` (anchor + `URL.createObjectURL`). Estado
  "Generando…" (deshabilitado) + toast de éxito/error.
- `src/app/dashboard/reportes/page.tsx`: arma `ReportePDFData` desde
  `existencias`/`productos` (ya cargados) y lo pasa al botón, colocado a la
  derecha del título (se envuelve el `PageHeader` en un flex con el botón).

## Flujo de datos

El server component de Reportes ya calcula `existencias` (vía
`inventoryService`). Se derivan las filas, KPIs y top productos y se pasan como
props planas al botón cliente. La generación del PDF ocurre 100% en el cliente
al hacer click; sin red ni servidor.

## Riesgos / notas

- `@react-pdf/renderer` es client-only y pesado → import dinámico en el handler
  evita inflar el bundle y problemas de SSR.
- react-pdf no renderiza HTML/Recharts; el reporte se maqueta con sus
  primitivos (tablas con `View`/`Text` en flex).
- Formato de moneda con `Intl.NumberFormat("es-MX", { currency: "MXN" })`.

## Criterios de éxito

1. En `/dashboard/reportes` el botón "Descargar PDF" genera y descarga un PDF
   con datos reales: header con logo piña, fecha, KPIs, tabla de inventario con
   total, y top productos.
2. El PDF se ve profesional (márgenes, tipografía, alineación de cifras,
   paginación).
3. `tsc --noEmit` = 0; `/dashboard/reportes` carga 200; bundle inicial no carga
   @react-pdf hasta el click.
4. Sin servidor, sin API keys, sin tocar dominio/servicios.
