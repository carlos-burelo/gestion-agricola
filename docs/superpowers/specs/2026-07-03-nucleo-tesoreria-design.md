# Núcleo de tesorería — cuentas, movimientos, traspasos y matriz mensual

**Fecha:** 2026-07-03
**Estado:** Aprobado por usuario, listo para plan de implementación

## Objetivo

Reemplazar `public/Control de Ingresos y Egresos 2025 V1.xlsx` (22 hojas-ledger
+ 12 hojas-matriz mensuales armadas a mano, 15,940 movimientos/año, ~$160M MXN
de flujo anual) por un núcleo de tesorería real: cuentas con saldo calculado,
un ledger unificado de movimientos, traspasos atómicos entre cuentas, y el
reporte de matriz mensual (categoría × cuenta) generado en vivo. Incluye
auth básico (login + rol) porque hoy varias personas capturan su propia
cuenta y el sistema no tiene ningún mecanismo de sesión.

Este es el **primer módulo** de una hoja de ruta más larga. Quedan fuera de
este spec (fases futuras, ya acordadas con el usuario): padrón de
trabajadores y nómina de campo (RAYA), amortización de préstamos con tabla
de pagos (como la hoja TRACTOR del Excel), y gasto personal/familiar con
vistas dedicadas por persona.

## Contexto del negocio (de dónde sale este modelo)

El Excel modela correctamente un negocio agrícola (piña + ganado + pomelo)
con 22 "cuentas": 6 bancos, 13 personas de confianza con cuenta propia
(familiares/empleados que mueven dinero), 2 cajas físicas (CAJA, CAJA
TIGRES — esta última exclusiva para anticipos de nómina de campo) y 1
RESERVA. Cada cuenta tiene su propio ledger transaccional (fecha, categoría
jerárquica tipo "4.1 FERTILIZANTES Y AGROQUIMICOS", beneficiario, monto,
saldo). Las 12 hojas mensuales son una matriz categoría×cuenta armada con
`SUMIFS` que apuntan a **rangos de fila fijos y editados a mano cada mes**
(ej. `MGZ121!$M$176:$312` para febrero) — la causa raíz de la fragilidad:
un rango mal ajustado rompe el mes silenciosamente (`IFERROR` devuelve 0,
no error visible), y el saldo inicial de cada mes se encadena del cierre
del mes anterior (`FEB25!C170 = 'ENE25'!C171`), así que un error se
propaga todo el año.

El sistema actual (`src/core/domain`, `schema.ts`) es 100% producción/
inventario/compras (ranchos → parcelas → ciclos → siembras → kardex →
órdenes de compra → `cuentasPorPagar`). No existe ninguna noción de cuenta
bancaria/efectivo/persona, traspaso, ni la taxonomía RAYA/PRODUCCION/
OPERACION/ADMINISTRATIVO/FINANCIERO/PERSONALES/FAMILIAS. Se construye
desde cero, pero reutilizando el patrón `Repository<T>` + `flatConfig` +
módulo genérico `[slug]` que ya existe.

## Alcance / no-alcance

- **Dentro:** tablas `categorias`, `cuentas`, `usuarios`, `usuarioCuentas`,
  `movimientos`, `traspasos`; auth por cookie de sesión con rol
  admin/persona; import histórico único desde el `.xlsx` (categorías,
  cuentas, 15,940 movimientos); ledger por cuenta con captura; traspaso
  atómico (1 acción de usuario → 2 filas de movimiento ligadas); reporte de
  matriz mensual (categoría×cuenta con rollup jerárquico, totales,
  acumulado).
- **Fuera (YAGNI / fases siguientes):** padrón de trabajadores y nómina de
  campo (RAYA sigue siendo beneficiario en texto libre, igual que hoy);
  tabla de amortización de préstamos (como TRACTOR); vistas dedicadas de
  gasto personal/familiar por persona; reconciliación bancaria automática
  (importar estado de cuenta del banco); multi-moneda con tipo de cambio
  (MGZ DOLARES se modela con `moneda` en la cuenta pero sin conversión —
  tuvo 0 movimientos en 2025); reconstrucción automática de pares de
  traspaso históricos (ver Import).

## Modelo de datos

Nuevos enums en `schema.ts` (no se reutiliza `tipoMovimiento` existente,
que es de inventario — dominio distinto, se evita acoplar ambos):

```
tipoCategoria:        "ingreso" | "egreso"
tipoCuenta:            "banco" | "efectivo" | "persona" | "reserva"
rolUsuario:            "admin" | "persona"
direccionMovimiento:   "entrada" | "salida"
```

Tablas nuevas (todas con `id: text primaryKey` + `...audit`, igual que el
resto del schema):

- **`categorias`**: `nombre`, `tipo` (ingreso/egreso), `parentId` (self-FK
  nullable, jerarquía), `orden` (integer, para respetar el orden del
  Excel), `activa` (boolean default true). Se siembra con la taxonomía
  completa (~90 categorías/subcategorías) leída de la hoja INDICE del
  Excel — **nada se descarta**; lo que cambia es que el código "4.1" deja
  de ser texto informal y pasa a ser jerarquía real de tabla.
- **`cuentas`**: `nombre`, `tipo` (banco/efectivo/persona/reserva),
  `moneda` (text, default `MXN`), `saldoInicial` (doublePrecision, default
  0 — el saldo de apertura al momento del import/corte), `activa`
  (boolean default true).
- **`usuarios`**: `nombre`, `email` (unique), `passwordHash`, `rol`
  (admin/persona), `activo` (boolean default true).
- **`usuarioCuentas`**: `usuarioId` (FK), `cuentaId` (FK) — qué cuentas
  puede capturar un usuario con `rol=persona`. Admin no necesita filas
  aquí, ve todo.
- **`movimientos`** (el ledger unificado — reemplaza las 22 hojas-ledger):
  `cuentaId` (FK), `fecha`, `direccion` (entrada/salida), `categoriaId`
  (FK nullable — null solo en filas generadas por un traspaso), `monto`
  (doublePrecision), `beneficiario` (text nullable), `referencia` (text
  nullable), `folio` (text nullable), `descripcion` (text nullable),
  `traspasoId` (FK nullable a `traspasos`), `creadoPor` (FK nullable a
  `usuarios` — nullable porque las filas importadas del histórico no
  tienen autor real).
- **`traspasos`**: `fecha`, `cuentaOrigenId` (FK), `cuentaDestinoId` (FK),
  `monto`, `referencia` (text nullable), `creadoPor` (FK nullable).

**Saldo de cuenta**: no se almacena ni se copia. Se calcula en la query del
reporte/ledger como `saldoInicial + SUM(entrada) - SUM(salida)` sobre
`movimientos` filtrado por `cuentaId` (y por fecha para saldo "a la
fecha X"). Con ~16k filas totales esto es trivial para Postgres — sin
necesidad de cachear ni de trigger.

## Enfoque de traspasos (atómico, sin duplicar captura a mano)

Crear un traspaso es **una sola acción de usuario** que en una transacción
de Drizzle (`db.transaction`, mismo patrón ya usado en
`aggregate-repository.ts`) inserta 1 fila en `traspasos` + 2 filas en
`movimientos` (salida en `cuentaOrigenId`, entrada en `cuentaDestinoId`,
ambas con `traspasoId` apuntando al traspaso y `categoriaId = null`). Esto
resuelve de raíz el problema #6 del Excel (cada traspaso se escribía a
mano en dos hojas distintas, sin garantía de que cuadraran). No encaja en
`AggregateRepository` genérico (ese patrón anida "líneas" dentro del
padre; aquí las 2 filas son movimientos independientes que deben aparecer
en el ledger normal de cada cuenta) — se implementa como función dedicada
`crearTraspaso()` en un nuevo `src/core/application/tesoreria-service.ts`,
al lado de `costing-service.ts`/`inventory-service.ts` que ya resuelven
casos similares de lógica multi-tabla fuera del CRUD genérico.

## Auth

Sesión simple con cookie httpOnly firmada (no se introduce NextAuth/Auth.js
completo — es más superficie de la que se necesita para ~15-20 usuarios
internos). Login con email + password (`bcrypt`). Middleware de Next.js
protege `/dashboard/**`; `rol=persona` solo ve/captura las cuentas listadas
en `usuarioCuentas`; `rol=admin` ve todo, incluida la matriz mensual
completa de todas las cuentas.

## Import histórico (sin perder información)

Script único (`scripts/import-tesoreria.ts`, corre una vez) que:
1. Lee el `.xlsx`, reconstruye `categorias` desde la hoja INDICE + los
   códigos jerárquicos de las hojas mensuales (ej. "4" → PRODUCCION padre,
   "4.1" → FERTILIZANTES Y AGROQUIMICOS hijo).
2. Crea las 22 `cuentas` con su `saldoInicial` tomado de la fila "SALDO
   INICIAL" de cada hoja-ledger.
3. Importa las 15,940 filas de los 22 ledgers como `movimientos`, tal cual
   están categorizadas hoy — **incluyendo** las filas "TRASPASO X": se
   importan como movimiento categorizado normal (bajo una categoría
   "Traspaso" en el árbol), **no** se reconstruyen como pares en la tabla
   `traspasos` nueva, porque emparejar salida↔entrada por fecha+monto
   entre 22 cuentas es propenso a error y el riesgo de un emparejamiento
   incorrecto es peor que dejarlas como historial plano. El mecanismo de
   traspaso atómico nuevo aplica solo hacia adelante desde el corte.

**Corte**: se importa todo hasta 2026-07-03 (fecha de este spec); desde ese
momento la app es la fuente de verdad y el Excel deja de capturarse.

## Reporte: matriz mensual

Query que agrupa `movimientos` por `categoriaId` (con rollup: el total de
una categoría padre = suma de sus hijas) × `cuentaId`, para un mes/año
dado, con fila de totales y columna de acumulado — el mismo reporte que
hoy se arma a mano con `SUMIFS`, generado en una sola consulta en vez de
mantener fórmulas por celda.

## UI

- `categorias` y `cuentas` se registran como módulos en
  `src/presentation/config/modules.ts` (patrón genérico `[slug]` que ya
  existe — `parentId` de categorías usa `reference: { collection:
  "categorias", labelField: "nombre" }`, igual que otras jerarquías del
  sistema). No requieren páginas a medida.
- `usuarios` y `usuarioCuentas` se administran vía módulo genérico también
  (el hash de password se calcula server-side antes de guardar, no se
  expone en el form genérico como texto plano — punto a resolver en el
  plan de implementación).
- Páginas a medida bajo `/dashboard/tesoreria` (se agrega `"tesoreria"` al
  `RESERVED` de `[slug]/page.tsx`):
  - `tesoreria/page.tsx` — lista de cuentas con saldo actual.
  - `tesoreria/[cuentaId]/page.tsx` — ledger de la cuenta (tabla +
    filtros + form de captura de movimiento).
  - `tesoreria/traspasos/page.tsx` — form origen→destino→monto→fecha.
  - `tesoreria/reportes/mensual/page.tsx` — la matriz, selector de mes/año.
- `/login` — form simple, redirige a `/dashboard/tesoreria`.

## Archivos

- `src/infrastructure/persistence/sql/schema.ts` (+6 tablas, +4 enums)
- `src/infrastructure/persistence/sql/table-config.ts` (+flatConfigs)
- `src/core/domain/entities.ts` (+tipos, +`CollectionMap`)
- `src/core/application/tesoreria-service.ts` (nuevo — `crearTraspaso`,
  helpers de saldo y matriz mensual)
- `src/presentation/config/modules.ts` (+módulos `categorias`, `cuentas`,
  `usuarios`, `usuarioCuentas`)
- `src/app/dashboard/tesoreria/**` (páginas nuevas)
- `src/app/login/page.tsx` + middleware de sesión
- `scripts/import-tesoreria.ts` (script de import, no queda en runtime)

## Criterios de éxito

1. Saldo de cada una de las 22 cuentas tras el import coincide con el
   saldo real del Excel a la fecha de corte (verificación manual contra
   el archivo original).
2. Crear un traspaso genera las 2 filas de movimiento correctas y ambos
   saldos de cuenta se actualizan de inmediato (sin doble captura).
3. La matriz mensual de un mes ya importado reproduce los mismos totales
   por categoría/cuenta que la hoja correspondiente del Excel.
4. `rol=persona` no puede ver ni capturar cuentas fuera de las asignadas
   en `usuarioCuentas`; `rol=admin` sí ve todo.
5. `tsc --noEmit` = 0; rutas nuevas responden 200 autenticado / redirect a
   `/login` sin sesión.
