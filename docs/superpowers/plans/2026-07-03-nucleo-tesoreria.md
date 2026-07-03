su# Núcleo de Tesorería — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `public/Control de Ingresos y Egresos 2025 V1.xlsx` (22 cuentas,
15,940 movimientos/año, matriz mensual armada a mano con `SUMIFS` de rango
fijo) with a real treasury core: `cuentas`, `movimientos`, `traspasos`
atómicos, `categorias` jerárquicas, auth básico por rol, y el reporte de
matriz mensual generado en vivo.

**Architecture:** Hexagonal, siguiendo el patrón ya establecido en el repo.
Tablas planas nuevas (`categorias`, `cuentas`, `usuarios`, `usuarioCuentas`,
`movimientos`, `traspasos`) se integran al `Repository<T>` genérico vía
`flatConfigs`. Lógica pura (saldo, rollup de matriz) vive en
`core/application/tesoreria-calc.ts` sin tocar I/O. `TesoreriaService`
(`core/application/tesoreria-service.ts`) orquesta usando solo puertos
`Repository<T>` — agnóstico de motor de persistencia, igual que
`CostingService`/`InventoryService`. La única pieza que rompe el puerto
genérico es `crearTraspaso` (necesita transacción atómica de 3 filas), que
por eso vive en `infrastructure/persistence/sql/tesoreria.ts`, al lado de
`aggregate-repository.ts`, que ya resuelve el mismo tipo de problema
(escritura multi-tabla atómica). Auth es sesión con cookie firmada HMAC
(`node:crypto`, cero dependencias nuevas) — no se introduce NextAuth.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM + Postgres,
shadcn/ui (Tailwind), pnpm. Sin test runner: verificación vía
`node:assert/strict` ejecutado con `tsx` (mismo patrón que
`scripts/checks/*.ts`) + `pnpm exec tsc --noEmit` + probes contra `next dev`.

## Global Constraints

- Package manager: **pnpm** exclusivamente.
- Toda fecha mostrada o capturada en UI pasa por `src/lib/dates.ts`
  (`formatDate`, `toDateInput`, `monthKey`) — nunca `toLocaleDateString` ni
  ISO crudo en JSX.
- Sin ESLint/test runner wired. Verificar con `pnpm exec tsc --noEmit` +
  scripts de `node:assert/strict` vía `tsx` + probes de ruta contra
  `next dev`. No correr `next build` mientras `next dev` está corriendo.
- Reutilizar el enum `estadoActivo` (`"activo"|"inactivo"`) ya existente en
  `schema.ts` para banderas de estado — no crear un enum nuevo por tabla.
- Reutilizar el patrón `Repository<T>` + `flatConfigs` + módulo genérico
  `[slug]` para todo lo que no necesite lógica a medida.
- Dinero: `doublePrecision`, igual que `cuentasPorPagar.importe` (convención
  existente, no se introduce `numeric`/`decimal`).
- Sin dependencias nuevas para auth (usar `node:crypto`: `scrypt` para
  password, `createHmac` para firmar cookie de sesión).
- `DB_DRIVER=sql` es el driver real; no se toca el adaptador JSON (queda
  detrás de la bandera, sin paridad para tesorería).
- Scripts standalone (import) crean su propia conexión
  `drizzle(postgres(DATABASE_URL))` en vez de importar el `db`
  `"server-only"` de `client.ts` — así corren con `tsx` plano, sin flags
  (mismo patrón que `scripts/db/seed.ts`). Scripts que sí importan capas
  `"server-only"` (repository, container) requieren
  `tsx --conditions=react-server`.
- Postgres local: `pnpm db:up` (docker, puerto 5433), migraciones con
  `pnpm db:generate` + `pnpm db:migrate`.

---

## Task 1: Schema — enums y 6 tablas nuevas

**Files:**
- Modify: `src/infrastructure/persistence/sql/schema.ts`

**Interfaces:**
- Produces: tablas Drizzle `categorias`, `cuentas`, `usuarios`,
  `usuarioCuentas`, `traspasos`, `movimientos`; enums `tipoCategoria`,
  `tipoCuenta`, `rolUsuario`, `direccionMovimiento`.

- [ ] **Step 1: Agregar los 4 enums nuevos**

En `src/infrastructure/persistence/sql/schema.ts`, después de la línea del
enum existente `tipoMovimiento` (línea 39: `export const tipoMovimiento =
pgEnum("tipo_movimiento", ["entrada", "salida"])`), agregar:

```ts
export const tipoCategoria = pgEnum("tipo_categoria", ["ingreso", "egreso"])
export const tipoCuenta = pgEnum("tipo_cuenta", [
  "banco",
  "efectivo",
  "persona",
  "reserva",
])
export const rolUsuario = pgEnum("rol_usuario", ["admin", "persona"])
export const direccionMovimiento = pgEnum("direccion_movimiento_financiero", [
  "entrada",
  "salida",
])
```

No se reutiliza `tipoMovimiento` (es de inventario, dominio distinto) para
no acoplar ambos por un enum Postgres compartido.

- [ ] **Step 2: Agregar `AnyPgColumn` al import de drizzle-orm/pg-core**

La línea 1-11 del archivo importa de `"drizzle-orm/pg-core"`. Agregar
`AnyPgColumn` a esa lista (se necesita para el self-FK de `categorias`):

```ts
import {
  type AnyPgColumn,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
```

- [ ] **Step 3: Agregar las 6 tablas al final del archivo**

Después de `detalleVale` (la última tabla, cierra en la línea ~329),
agregar:

```ts
// 14. Tesorería
export const categorias = pgTable("categorias", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipo: tipoCategoria("tipo").notNull(),
  parentId: text("parent_id").references((): AnyPgColumn => categorias.id),
  orden: integer("orden").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const cuentas = pgTable("cuentas", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipo: tipoCuenta("tipo").notNull(),
  moneda: text("moneda").notNull(),
  saldoInicial: doublePrecision("saldo_inicial").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rol: rolUsuario("rol").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const usuarioCuentas = pgTable("usuario_cuentas", {
  id: text("id").primaryKey(),
  usuarioId: text("usuario_id")
    .notNull()
    .references(() => usuarios.id),
  cuentaId: text("cuenta_id")
    .notNull()
    .references(() => cuentas.id),
  ...audit,
})

export const traspasos = pgTable("traspasos", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  cuentaOrigenId: text("cuenta_origen_id")
    .notNull()
    .references(() => cuentas.id),
  cuentaDestinoId: text("cuenta_destino_id")
    .notNull()
    .references(() => cuentas.id),
  monto: doublePrecision("monto").notNull(),
  referencia: text("referencia"),
  creadoPor: text("creado_por").references(() => usuarios.id),
  ...audit,
})

export const movimientos = pgTable("movimientos", {
  id: text("id").primaryKey(),
  cuentaId: text("cuenta_id")
    .notNull()
    .references(() => cuentas.id),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  direccion: direccionMovimiento("direccion").notNull(),
  categoriaId: text("categoria_id").references(() => categorias.id),
  monto: doublePrecision("monto").notNull(),
  beneficiario: text("beneficiario"),
  referencia: text("referencia"),
  folio: text("folio"),
  descripcion: text("descripcion"),
  traspasoId: text("traspaso_id").references(() => traspasos.id),
  creadoPor: text("creado_por").references(() => usuarios.id),
  ...audit,
})
```

Orden importa: `categorias` y `cuentas` y `usuarios` deben quedar declaradas
antes que `usuarioCuentas`/`traspasos`/`movimientos` (referencias hacia
adelante fallan en Drizzle para FKs normales, solo el self-FK de
`categorias` usa el patrón `(): AnyPgColumn => ...`).

- [ ] **Step 4: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Levantar Postgres local y generar/aplicar migración**

```bash
pnpm db:up
pnpm db:generate
pnpm db:migrate
```

Expected: `db:generate` crea un archivo nuevo en `./drizzle/` (ej.
`0007_*.sql`) con `CREATE TYPE` para los 4 enums y `CREATE TABLE` para las 6
tablas; `db:migrate` aplica sin error.

- [ ] **Step 6: Commit**

```bash
git add src/infrastructure/persistence/sql/schema.ts drizzle/
git commit -m "feat(tesoreria): schema de cuentas, movimientos, traspasos, categorias, usuarios"
```

---

## Task 2: `table-config.ts` — flatConfigs de las 6 tablas nuevas

**Files:**
- Modify: `src/infrastructure/persistence/sql/table-config.ts`

**Interfaces:**
- Consumes: `s.categorias`, `s.cuentas`, `s.usuarios`, `s.usuarioCuentas`,
  `s.traspasos`, `s.movimientos` (Task 1).
- Produces: entradas en `flatConfigs` para las collections `"categorias"`,
  `"cuentas"`, `"usuarios"`, `"usuarioCuentas"`, `"traspasos"`,
  `"movimientos"`.

- [ ] **Step 1: Agregar las entradas a `flatConfigs`**

Dentro del objeto `flatConfigs` (después de la entrada `cuentasPorPagar`,
antes del cierre `}` en la línea 47), agregar:

```ts
  categorias: {
    table: s.categorias,
    dateFields: AUDIT,
    nullableFields: ["parentId"],
  },
  cuentas: { table: s.cuentas, dateFields: AUDIT },
  usuarios: { table: s.usuarios, dateFields: AUDIT },
  usuarioCuentas: { table: s.usuarioCuentas, dateFields: AUDIT },
  traspasos: {
    table: s.traspasos,
    dateFields: ["fecha", ...AUDIT],
    nullableFields: ["referencia", "creadoPor"],
  },
  movimientos: {
    table: s.movimientos,
    dateFields: ["fecha", ...AUDIT],
    nullableFields: [
      "categoriaId",
      "beneficiario",
      "referencia",
      "folio",
      "descripcion",
      "traspasoId",
      "creadoPor",
    ],
  },
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores (fallará hasta el Task 3 si `CollectionName` no
reconoce los nombres — si eso pasa, es esperado en este punto; continuar).

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/persistence/sql/table-config.ts
git commit -m "feat(tesoreria): flatConfigs para las 6 tablas nuevas"
```

---

## Task 3: `entities.ts` — tipos de dominio y `CollectionMap`

**Files:**
- Modify: `src/core/domain/entities.ts`

**Interfaces:**
- Produces: `Categoria`, `Cuenta`, `Usuario`, `UsuarioCuenta`, `Traspaso`,
  `Movimiento` (todos `extends BaseEntity`); `TipoCategoria`, `TipoCuenta`,
  `RolUsuario`, `DireccionMovimiento`; entradas en `CollectionMap`.

- [ ] **Step 1: Agregar los tipos**

Después de la sección `13. Vales de salida` (antes del bloque de
`CollectionMap`, línea ~267), agregar:

```ts
/* -------------------------------------------------------------------------- */
/* 14. Tesorería                                                              */
/* -------------------------------------------------------------------------- */

export type TipoCategoria = "ingreso" | "egreso"

export interface Categoria extends BaseEntity {
  nombre: string
  tipo: TipoCategoria
  /** "" = categoría raíz (sin padre). */
  parentId: string
  orden: number
  estado: EstadoActivo
}

export type TipoCuenta = "banco" | "efectivo" | "persona" | "reserva"

export interface Cuenta extends BaseEntity {
  nombre: string
  tipo: TipoCuenta
  moneda: string
  saldoInicial: number
  estado: EstadoActivo
}

export type RolUsuario = "admin" | "persona"

export interface Usuario extends BaseEntity {
  nombre: string
  email: string
  passwordHash: string
  rol: RolUsuario
  estado: EstadoActivo
}

export interface UsuarioCuenta extends BaseEntity {
  usuarioId: string
  cuentaId: string
}

export interface Traspaso extends BaseEntity {
  fecha: string
  cuentaOrigenId: string
  cuentaDestinoId: string
  monto: number
  /** "" = sin referencia. */
  referencia: string
  /** "" = sin autor (import histórico). */
  creadoPor: string
}

export type DireccionMovimiento = "entrada" | "salida"

export interface Movimiento extends BaseEntity {
  cuentaId: string
  fecha: string
  direccion: DireccionMovimiento
  /** "" = movimiento generado por un traspaso (sin categoría propia). */
  categoriaId: string
  monto: number
  beneficiario: string
  referencia: string
  folio: string
  descripcion: string
  /** "" = movimiento normal (no viene de un traspaso). */
  traspasoId: string
  /** "" = sin autor (import histórico). */
  creadoPor: string
}
```

- [ ] **Step 2: Registrar en `CollectionMap`**

Dentro de `export interface CollectionMap { ... }`, después de
`valesSalida: ValeSalida`, agregar:

```ts
  categorias: Categoria
  cuentas: Cuenta
  usuarios: Usuario
  usuarioCuentas: UsuarioCuenta
  traspasos: Traspaso
  movimientos: Movimiento
```

- [ ] **Step 3: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/core/domain/entities.ts
git commit -m "feat(tesoreria): tipos de dominio y CollectionMap"
```

---

## Task 4: `tesoreria-calc.ts` — `calcularSaldo` (lógica pura)

**Files:**
- Create: `src/core/application/tesoreria-calc.ts`
- Create: `scripts/checks/tesoreria-calc.ts`

**Interfaces:**
- Consumes: `Movimiento`, `DireccionMovimiento` (Task 3).
- Produces: `calcularSaldo(saldoInicial: number, movimientos:
  Pick<Movimiento, "direccion" | "monto">[]): number`.

- [ ] **Step 1: Escribir el check (falla primero)**

Crear `scripts/checks/tesoreria-calc.ts`:

```ts
import assert from "node:assert/strict"
import { calcularSaldo } from "@/core/application/tesoreria-calc"

// Saldo inicial + una entrada + una salida.
const saldo1 = calcularSaldo(1000, [
  { direccion: "entrada", monto: 500 },
  { direccion: "salida", monto: 200 },
])
assert.equal(saldo1, 1300, "1000 + 500 - 200 = 1300")

// Sin movimientos, el saldo es el inicial.
assert.equal(calcularSaldo(250, []), 250)

// Solo salidas puede dar negativo (no se trunca en 0 — refleja sobregiro real).
assert.equal(calcularSaldo(100, [{ direccion: "salida", monto: 300 }]), -200)

console.log("OK tesoreria-calc: calcularSaldo")
```

- [ ] **Step 2: Correr y confirmar que falla**

Run: `npx tsx scripts/checks/tesoreria-calc.ts`
Expected: FAIL — `Cannot find module '@/core/application/tesoreria-calc'`.

- [ ] **Step 3: Implementar**

Crear `src/core/application/tesoreria-calc.ts`:

```ts
import type { DireccionMovimiento } from "@/core/domain/entities"

/**
 * saldo = saldoInicial + Σ(entradas) - Σ(salidas). No se trunca en 0: un
 * saldo negativo es información real (sobregiro), no un error de cálculo.
 */
export function calcularSaldo(
  saldoInicial: number,
  movimientos: { direccion: DireccionMovimiento; monto: number }[],
): number {
  return movimientos.reduce(
    (saldo, m) => saldo + (m.direccion === "entrada" ? m.monto : -m.monto),
    saldoInicial,
  )
}
```

- [ ] **Step 4: Correr y confirmar que pasa**

Run: `npx tsx scripts/checks/tesoreria-calc.ts`
Expected: `OK tesoreria-calc: calcularSaldo`

- [ ] **Step 5: Commit**

```bash
git add src/core/application/tesoreria-calc.ts scripts/checks/tesoreria-calc.ts
git commit -m "feat(tesoreria): calcularSaldo (lógica pura)"
```

---

## Task 5: `tesoreria-calc.ts` — `calcularMatrizMensual` (rollup jerárquico)

**Files:**
- Modify: `src/core/application/tesoreria-calc.ts`
- Modify: `scripts/checks/tesoreria-calc.ts`

**Interfaces:**
- Consumes: `Categoria`, `Movimiento` (Task 3); `monthKey` de
  `@/lib/dates`.
- Produces: `FilaMatriz`, `MatrizMensual` (tipos); `calcularMatrizMensual(
  categorias: Categoria[], movimientos: Movimiento[], mes: number, anio:
  number): MatrizMensual`.

Replica fielmente cómo lo hace el Excel: cada categoría **hoja** se llena
con `SUMIFS` (monto de movimientos que matchean esa categoría y su
dirección esperada); cada categoría **padre** es `SUM()` de sus hijas
directas (verificado contra la fórmula real del archivo:
`ENE25!C21 = SUM(C22:C28)` para la fila de PRODUCCION). No hay
doble-conteo porque un movimiento solo se asocia a una hoja.

- [ ] **Step 1: Agregar casos al check (falla primero)**

Agregar al final de `scripts/checks/tesoreria-calc.ts` (antes del último
`console.log`, o agregar un segundo bloque después de él):

```ts
import { calcularMatrizMensual } from "@/core/application/tesoreria-calc"

const categorias = [
  {
    id: "cat-produccion",
    nombre: "PRODUCCION",
    tipo: "egreso" as const,
    parentId: "",
    orden: 1,
    estado: "activo" as const,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "cat-fertilizantes",
    nombre: "FERTILIZANTES Y AGROQUIMICOS",
    tipo: "egreso" as const,
    parentId: "cat-produccion",
    orden: 2,
    estado: "activo" as const,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "cat-cortes",
    nombre: "CORTES Y FLETES",
    tipo: "egreso" as const,
    parentId: "cat-produccion",
    orden: 3,
    estado: "activo" as const,
    createdAt: "",
    updatedAt: "",
  },
]

const movimientos = [
  {
    id: "m1",
    cuentaId: "cta-mgz121",
    fecha: "2025-01-15T00:00:00.000Z",
    direccion: "salida" as const,
    categoriaId: "cat-fertilizantes",
    monto: 1000,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "",
    traspasoId: "",
    creadoPor: "",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "m2",
    cuentaId: "cta-mgz121",
    fecha: "2025-01-20T00:00:00.000Z",
    direccion: "salida" as const,
    categoriaId: "cat-cortes",
    monto: 300,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "",
    traspasoId: "",
    creadoPor: "",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "m3",
    cuentaId: "cta-mgz121",
    fecha: "2025-02-01T00:00:00.000Z",
    direccion: "salida" as const,
    categoriaId: "cat-fertilizantes",
    monto: 9999,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "",
    traspasoId: "",
    creadoPor: "",
    createdAt: "",
    updatedAt: "",
  },
]

const matriz = calcularMatrizMensual(categorias, movimientos, 1, 2025)
const fertilizantes = matriz.filas.find((f) => f.categoriaId === "cat-fertilizantes")!
const produccion = matriz.filas.find((f) => f.categoriaId === "cat-produccion")!
assert.equal(fertilizantes.porCuenta["cta-mgz121"], 1000, "solo enero, no febrero")
assert.equal(produccion.total, 1300, "PRODUCCION = suma de sus dos hijas (1000+300)")
assert.equal(matriz.totalGeneral, 1300)

console.log("OK tesoreria-calc: calcularMatrizMensual")
```

- [ ] **Step 2: Correr y confirmar que falla**

Run: `npx tsx scripts/checks/tesoreria-calc.ts`
Expected: FAIL — `calcularMatrizMensual is not a function` (o export no
encontrado).

- [ ] **Step 3: Implementar**

Agregar a `src/core/application/tesoreria-calc.ts`:

```ts
import { monthKey } from "@/lib/dates"
import type { Categoria, Movimiento, TipoCategoria } from "@/core/domain/entities"

export interface FilaMatriz {
  categoriaId: string
  nombre: string
  tipo: TipoCategoria
  nivel: number
  porCuenta: Record<string, number>
  total: number
}

export interface MatrizMensual {
  filas: FilaMatriz[]
  totalesPorCuenta: Record<string, number>
  totalGeneral: number
}

const direccionEsperada: Record<TipoCategoria, "entrada" | "salida"> = {
  ingreso: "entrada",
  egreso: "salida",
}

export function calcularMatrizMensual(
  categorias: Categoria[],
  movimientos: Movimiento[],
  mes: number,
  anio: number,
): MatrizMensual {
  const claveMes = `${anio}-${String(mes).padStart(2, "0")}`
  const delMes = movimientos.filter((m) => monthKey(m.fecha) === claveMes)

  const hijosPorPadre = new Map<string, Categoria[]>()
  for (const c of categorias) {
    const lista = hijosPorPadre.get(c.parentId) ?? []
    lista.push(c)
    hijosPorPadre.set(c.parentId, lista)
  }
  const esHoja = (c: Categoria) => !hijosPorPadre.has(c.id)

  const porCuentaDe = (categoriaId: string, tipo: TipoCategoria): Record<string, number> => {
    const totales: Record<string, number> = {}
    for (const m of delMes) {
      if (m.categoriaId !== categoriaId) continue
      if (m.direccion !== direccionEsperada[tipo]) continue
      totales[m.cuentaId] = (totales[m.cuentaId] ?? 0) + m.monto
    }
    return totales
  }

  const sumarPorCuenta = (a: Record<string, number>, b: Record<string, number>) => {
    const out = { ...a }
    for (const [cuentaId, monto] of Object.entries(b)) {
      out[cuentaId] = (out[cuentaId] ?? 0) + monto
    }
    return out
  }

  const filaDe = (c: Categoria, nivel: number): FilaMatriz => {
    const porCuenta = esHoja(c)
      ? porCuentaDe(c.id, c.tipo)
      : (hijosPorPadre.get(c.id) ?? [])
          .map((hijo) => filaDe(hijo, nivel + 1).porCuenta)
          .reduce(sumarPorCuenta, {})
    const total = Object.values(porCuenta).reduce((a, b) => a + b, 0)
    return { categoriaId: c.id, nombre: c.nombre, tipo: c.tipo, nivel, porCuenta, total }
  }

  const raices = categorias
    .filter((c) => c.parentId === "")
    .sort((a, b) => a.orden - b.orden)

  const filas: FilaMatriz[] = []
  const aplanar = (c: Categoria, nivel: number) => {
    const fila = filaDe(c, nivel)
    filas.push(fila)
    for (const hijo of (hijosPorPadre.get(c.id) ?? []).sort((a, b) => a.orden - b.orden)) {
      aplanar(hijo, nivel + 1)
    }
  }
  for (const raiz of raices) aplanar(raiz, 0)

  const totalesPorCuenta = filas
    .filter((f) => f.nivel === 0)
    .map((f) => f.porCuenta)
    .reduce(sumarPorCuenta, {})
  const totalGeneral = Object.values(totalesPorCuenta).reduce((a, b) => a + b, 0)

  return { filas, totalesPorCuenta, totalGeneral }
}
```

Nota: `totalesPorCuenta`/`totalGeneral` suman solo las filas raíz (`nivel
0`) para no contar dos veces (una raíz ya incluye a sus hijas por el
rollup). Si el negocio necesita separar ingresos vs egresos en el total
general en vez de sumarlos directo, eso se resuelve en la vista (Task 14)
filtrando `filas.filter(f => f.tipo === "ingreso" && f.nivel === 0)`, no
aquí — esta función se mantiene simple (YAGNI).

- [ ] **Step 4: Correr y confirmar que pasa**

Run: `npx tsx scripts/checks/tesoreria-calc.ts`
Expected: dos líneas `OK tesoreria-calc: ...`.

- [ ] **Step 5: `tsc --noEmit` y commit**

```bash
pnpm exec tsc --noEmit
git add src/core/application/tesoreria-calc.ts scripts/checks/tesoreria-calc.ts
git commit -m "feat(tesoreria): calcularMatrizMensual (rollup jerárquico)"
```

---

## Task 6: `TesoreriaService` — saldo y reporte mensual vía puertos

**Files:**
- Create: `src/core/application/tesoreria-service.ts`
- Modify: `src/infrastructure/container.ts`
- Create: `scripts/checks/tesoreria-service.ts`

**Interfaces:**
- Consumes: `Repository<T>` (puerto existente), `calcularSaldo`,
  `calcularMatrizMensual` (Task 4-5), `repository()` (Task 3 registra las
  collections en `CollectionName`).
- Produces: clase `TesoreriaService` con `saldoDeCuenta(cuentaId: string):
  Promise<number>`, `saldosDeTodasLasCuentas(): Promise<Record<string,
  number>>`, `reporteMensual(mes: number, anio: number):
  Promise<MatrizMensual>`; factory `tesoreriaService()` en `container.ts`.

Requiere Postgres corriendo (`pnpm db:up`) con las tablas del Task 1 ya
migradas — este check inserta y lee contra la base real.

- [ ] **Step 1: Escribir el check (falla primero)**

Crear `scripts/checks/tesoreria-service.ts`:

```ts
import "dotenv/config"
import assert from "node:assert/strict"
import { repository, tesoreriaService } from "@/infrastructure/container"

async function main() {
  const cuentaRepo = repository("cuentas")
  const cuenta = await cuentaRepo.create({
    nombre: "Check TesoreriaService",
    tipo: "efectivo",
    moneda: "MXN",
    saldoInicial: 1000,
    estado: "activo",
  })

  const movRepo = repository("movimientos")
  await movRepo.create({
    cuentaId: cuenta.id,
    fecha: "2025-03-05T00:00:00.000Z",
    direccion: "entrada",
    categoriaId: "",
    monto: 500,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "check",
    traspasoId: "",
    creadoPor: "",
  })
  await movRepo.create({
    cuentaId: cuenta.id,
    fecha: "2025-03-06T00:00:00.000Z",
    direccion: "salida",
    categoriaId: "",
    monto: 200,
    beneficiario: "",
    referencia: "",
    folio: "",
    descripcion: "check",
    traspasoId: "",
    creadoPor: "",
  })

  const service = tesoreriaService()
  const saldo = await service.saldoDeCuenta(cuenta.id)
  assert.equal(saldo, 1300, "1000 + 500 - 200 = 1300")

  const saldos = await service.saldosDeTodasLasCuentas()
  assert.equal(saldos[cuenta.id], 1300)

  console.log("OK tesoreria-service:", { saldo })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Correr y confirmar que falla**

```bash
pnpm db:up
npx tsx --conditions=react-server scripts/checks/tesoreria-service.ts
```

Expected: FAIL — `tesoreriaService is not a function` (no existe aún en
`container.ts`).

- [ ] **Step 3: Implementar `TesoreriaService`**

Crear `src/core/application/tesoreria-service.ts`:

```ts
import type { Categoria, Cuenta, Movimiento } from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import type { Repository } from "@/core/domain/repositories"
import { calcularMatrizMensual, calcularSaldo, type MatrizMensual } from "./tesoreria-calc"

export class TesoreriaService {
  constructor(
    private readonly cuentas: Repository<Cuenta>,
    private readonly categorias: Repository<Categoria>,
    private readonly movimientos: Repository<Movimiento>,
  ) {}

  async saldoDeCuenta(cuentaId: string): Promise<number> {
    const cuenta = await this.cuentas.findById(cuentaId)
    if (!cuenta) throw new NotFoundError("cuentas", cuentaId)
    const movs = await this.movimientos.findBy({ cuentaId } as Partial<Movimiento>)
    return calcularSaldo(cuenta.saldoInicial, movs)
  }

  async saldosDeTodasLasCuentas(): Promise<Record<string, number>> {
    const [cuentas, movimientos] = await Promise.all([
      this.cuentas.findAll(),
      this.movimientos.findAll(),
    ])
    const porCuenta = new Map<string, Movimiento[]>()
    for (const m of movimientos) {
      const lista = porCuenta.get(m.cuentaId) ?? []
      lista.push(m)
      porCuenta.set(m.cuentaId, lista)
    }
    const out: Record<string, number> = {}
    for (const cuenta of cuentas) {
      out[cuenta.id] = calcularSaldo(cuenta.saldoInicial, porCuenta.get(cuenta.id) ?? [])
    }
    return out
  }

  async reporteMensual(mes: number, anio: number): Promise<MatrizMensual> {
    const [categorias, movimientos] = await Promise.all([
      this.categorias.findAll(),
      this.movimientos.findAll(),
    ])
    return calcularMatrizMensual(categorias, movimientos, mes, anio)
  }
}
```

`findAll()` trae todos los movimientos en cada llamada (~16k filas tras el
import) — aceptable para un reporte/dashboard que no es hot path; el
puerto `Repository<T>` no tiene filtro por rango de fecha (`findBy` solo
hace igualdad estricta). Si en producción esto resulta lento, se optimiza
después agregando un método de rango — no se resuelve preventivamente
(YAGNI).

- [ ] **Step 4: Wire en `container.ts`**

En `src/infrastructure/container.ts`, agregar el import y la factory
(después de `traceabilityService`):

```ts
import { TesoreriaService } from "@/core/application/tesoreria-service"
```

```ts
export function tesoreriaService(): TesoreriaService {
  return new TesoreriaService(
    repository("cuentas"),
    repository("categorias"),
    repository("movimientos"),
  )
}
```

- [ ] **Step 5: Correr y confirmar que pasa**

```bash
npx tsx --conditions=react-server scripts/checks/tesoreria-service.ts
```

Expected: `OK tesoreria-service: { saldo: 1300 }`

- [ ] **Step 6: `tsc --noEmit` y commit**

```bash
pnpm exec tsc --noEmit
git add src/core/application/tesoreria-service.ts src/infrastructure/container.ts scripts/checks/tesoreria-service.ts
git commit -m "feat(tesoreria): TesoreriaService (saldo, saldos, reporte mensual)"
```

---

## Task 7: `crearTraspaso` — escritura atómica de 2 movimientos ligados

**Files:**
- Create: `src/infrastructure/persistence/sql/tesoreria.ts`
- Modify: `src/infrastructure/container.ts`
- Create: `scripts/checks/tesoreria-traspaso.ts`

**Interfaces:**
- Consumes: `db` de `./client` (server-only), `DrizzleRepository` (ya
  existe en `./repository.ts`), `generateId`/`nowDate` de `./util.ts`,
  `BusinessRuleError` de `@/core/domain/errors`.
- Produces: `crearTraspaso(input: CrearTraspasoInput): Promise<{ traspaso:
  Traspaso; movimientoOrigen: Movimiento; movimientoDestino: Movimiento
  }>`; export re-expuesto en `container.ts`.

- [ ] **Step 1: Escribir el check (falla primero)**

Crear `scripts/checks/tesoreria-traspaso.ts`:

```ts
import "dotenv/config"
import assert from "node:assert/strict"
import { crearTraspaso, repository, tesoreriaService } from "@/infrastructure/container"

async function main() {
  const cuentaRepo = repository("cuentas")
  const origen = await cuentaRepo.create({
    nombre: "Check Origen",
    tipo: "efectivo",
    moneda: "MXN",
    saldoInicial: 1000,
    estado: "activo",
  })
  const destino = await cuentaRepo.create({
    nombre: "Check Destino",
    tipo: "efectivo",
    moneda: "MXN",
    saldoInicial: 0,
    estado: "activo",
  })

  const resultado = await crearTraspaso({
    fecha: "2025-04-01T00:00:00.000Z",
    cuentaOrigenId: origen.id,
    cuentaDestinoId: destino.id,
    monto: 300,
  })

  assert.equal(resultado.movimientoOrigen.direccion, "salida")
  assert.equal(resultado.movimientoOrigen.cuentaId, origen.id)
  assert.equal(resultado.movimientoDestino.direccion, "entrada")
  assert.equal(resultado.movimientoDestino.cuentaId, destino.id)
  assert.equal(resultado.movimientoOrigen.traspasoId, resultado.traspaso.id)
  assert.equal(resultado.movimientoDestino.traspasoId, resultado.traspaso.id)

  const service = tesoreriaService()
  assert.equal(await service.saldoDeCuenta(origen.id), 700, "1000 - 300")
  assert.equal(await service.saldoDeCuenta(destino.id), 300, "0 + 300")

  // Regla de negocio: misma cuenta origen/destino debe rechazarse.
  await assert.rejects(
    () =>
      crearTraspaso({
        fecha: "2025-04-01T00:00:00.000Z",
        cuentaOrigenId: origen.id,
        cuentaDestinoId: origen.id,
        monto: 100,
      }),
    /misma/i,
  )

  console.log("OK tesoreria-traspaso")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Correr y confirmar que falla**

```bash
npx tsx --conditions=react-server scripts/checks/tesoreria-traspaso.ts
```

Expected: FAIL — `crearTraspaso is not a function`.

- [ ] **Step 3: Implementar**

Crear `src/infrastructure/persistence/sql/tesoreria.ts`:

```ts
import "server-only"
import type { Movimiento, Traspaso } from "@/core/domain/entities"
import { BusinessRuleError } from "@/core/domain/errors"
import { db } from "./client"
import { movimientos, traspasos } from "./schema"
import { DrizzleRepository } from "./repository"
import { generateId, nowDate } from "./util"

export interface CrearTraspasoInput {
  fecha: string
  cuentaOrigenId: string
  cuentaDestinoId: string
  monto: number
  referencia?: string
  creadoPor?: string
}

export interface TraspasoCreado {
  traspaso: Traspaso
  movimientoOrigen: Movimiento
  movimientoDestino: Movimiento
}

export async function crearTraspaso(
  input: CrearTraspasoInput,
): Promise<TraspasoCreado> {
  if (input.cuentaOrigenId === input.cuentaDestinoId) {
    throw new BusinessRuleError(
      "La cuenta de origen y destino no pueden ser la misma.",
    )
  }
  if (!(input.monto > 0)) {
    throw new BusinessRuleError("El monto del traspaso debe ser mayor a 0.")
  }

  const now = nowDate()
  const fecha = new Date(input.fecha)
  const traspasoId = generateId("traspasos")
  const movimientoOrigenId = generateId("movimientos")
  const movimientoDestinoId = generateId("movimientos")
  const referencia = input.referencia ?? null
  const creadoPor = input.creadoPor ?? null

  await db.transaction(async (tx) => {
    await tx.insert(traspasos).values({
      id: traspasoId,
      fecha,
      cuentaOrigenId: input.cuentaOrigenId,
      cuentaDestinoId: input.cuentaDestinoId,
      monto: input.monto,
      referencia,
      creadoPor,
      createdAt: now,
      updatedAt: now,
    })
    await tx.insert(movimientos).values([
      {
        id: movimientoOrigenId,
        cuentaId: input.cuentaOrigenId,
        fecha,
        direccion: "salida",
        categoriaId: null,
        monto: input.monto,
        beneficiario: null,
        referencia,
        folio: null,
        descripcion: "Traspaso de salida",
        traspasoId,
        creadoPor,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: movimientoDestinoId,
        cuentaId: input.cuentaDestinoId,
        fecha,
        direccion: "entrada",
        categoriaId: null,
        monto: input.monto,
        beneficiario: null,
        referencia,
        folio: null,
        descripcion: "Traspaso de entrada",
        traspasoId,
        creadoPor,
        createdAt: now,
        updatedAt: now,
      },
    ])
  })

  const traspasoRepo = new DrizzleRepository<Traspaso>("traspasos")
  const movimientoRepo = new DrizzleRepository<Movimiento>("movimientos")
  const [traspaso, movimientoOrigen, movimientoDestino] = await Promise.all([
    traspasoRepo.findById(traspasoId),
    movimientoRepo.findById(movimientoOrigenId),
    movimientoRepo.findById(movimientoDestinoId),
  ])
  return {
    traspaso: traspaso!,
    movimientoOrigen: movimientoOrigen!,
    movimientoDestino: movimientoDestino!,
  }
}
```

- [ ] **Step 4: Wire en `container.ts`**

```ts
export { crearTraspaso } from "./persistence/sql/tesoreria"
```

(agregar al final de `src/infrastructure/container.ts`).

- [ ] **Step 5: Correr y confirmar que pasa**

```bash
npx tsx --conditions=react-server scripts/checks/tesoreria-traspaso.ts
```

Expected: `OK tesoreria-traspaso`

- [ ] **Step 6: `tsc --noEmit` y commit**

```bash
pnpm exec tsc --noEmit
git add src/infrastructure/persistence/sql/tesoreria.ts src/infrastructure/container.ts scripts/checks/tesoreria-traspaso.ts
git commit -m "feat(tesoreria): crearTraspaso atómico (2 movimientos ligados)"
```

---

## Task 8: Auth — hash de password y token de sesión firmado

**Files:**
- Create: `src/infrastructure/auth/password.ts`
- Create: `src/infrastructure/auth/session.ts`
- Create: `scripts/checks/auth.ts`
- Modify: `.env`, `.env.example`

**Interfaces:**
- Produces: `hashPassword(password: string): string`,
  `verifyPassword(password: string, stored: string): boolean`;
  `crearToken(payload: SessionPayload): string`,
  `verificarToken(token: string): SessionPayload | null`,
  interface `SessionPayload { usuarioId: string; rol: RolUsuario; exp:
  number }`.

Ninguno de los dos archivos importa `"server-only"` ni `db` — son
utilidades de criptografía puras sobre `node:crypto`, corren con `tsx`
plano (sin `--conditions=react-server`) y son seguras de importar tanto
desde Server Actions/Route Handlers como desde middleware.

- [ ] **Step 1: Generar y agregar `SESSION_SECRET`**

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copiar el valor impreso y agregarlo a `.env`:

```
SESSION_SECRET=<valor generado>
```

Y agregar a `.env.example` (con un placeholder, no el valor real):

```
SESSION_SECRET=changeme-generate-with-crypto-randomBytes
```

- [ ] **Step 2: Escribir el check (falla primero)**

Crear `scripts/checks/auth.ts`:

```ts
import "dotenv/config"
import assert from "node:assert/strict"
import { hashPassword, verifyPassword } from "@/infrastructure/auth/password"
import { crearToken, verificarToken } from "@/infrastructure/auth/session"

const hash = hashPassword("correcto-caballo-batería")
assert.ok(hash.includes(":"), "formato salt:derivado")
assert.ok(verifyPassword("correcto-caballo-batería", hash), "password correcto debe verificar")
assert.ok(!verifyPassword("incorrecto", hash), "password incorrecto no debe verificar")

const token = crearToken({ usuarioId: "u1", rol: "admin", exp: Date.now() + 60_000 })
const payload = verificarToken(token)
assert.equal(payload?.usuarioId, "u1")
assert.equal(payload?.rol, "admin")

// Token alterado no debe verificar.
const alterado = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A")
assert.equal(verificarToken(alterado), null, "firma alterada debe rechazarse")

// Token expirado no debe verificar.
const expirado = crearToken({ usuarioId: "u1", rol: "admin", exp: Date.now() - 1 })
assert.equal(verificarToken(expirado), null, "token expirado debe rechazarse")

console.log("OK auth: password + session")
```

- [ ] **Step 3: Correr y confirmar que falla**

Run: `npx tsx scripts/checks/auth.ts`
Expected: FAIL — módulos no encontrados.

- [ ] **Step 4: Implementar `password.ts`**

Crear `src/infrastructure/auth/password.ts`:

```ts
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex")
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, derivedHex] = stored.split(":")
  if (!salt || !derivedHex) return false
  const derived = scryptSync(password, salt, KEY_LENGTH)
  const almacenado = Buffer.from(derivedHex, "hex")
  if (derived.length !== almacenado.length) return false
  return timingSafeEqual(derived, almacenado)
}
```

- [ ] **Step 5: Implementar `session.ts`**

Crear `src/infrastructure/auth/session.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto"
import type { RolUsuario } from "@/core/domain/entities"

export interface SessionPayload {
  usuarioId: string
  rol: RolUsuario
  /** epoch ms */
  exp: number
}

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error("SESSION_SECRET no está configurado.")
  return s
}

function firmar(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url")
}

export function crearToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${data}.${firmar(data)}`
}

export function verificarToken(token: string): SessionPayload | null {
  const [data, firma] = token.split(".")
  if (!data || !firma) return null
  const esperada = firmar(data)
  const a = Buffer.from(firma)
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString())
  } catch {
    return null
  }
  if (payload.exp < Date.now()) return null
  return payload
}
```

- [ ] **Step 6: Correr y confirmar que pasa**

Run: `npx tsx scripts/checks/auth.ts`
Expected: `OK auth: password + session`

- [ ] **Step 7: `tsc --noEmit` y commit**

```bash
pnpm exec tsc --noEmit
git add src/infrastructure/auth/password.ts src/infrastructure/auth/session.ts scripts/checks/auth.ts .env.example
git commit -m "feat(auth): hash de password (scrypt) y token de sesión firmado (HMAC)"
```

`.env` no se commitea (ya está fuera de control de versiones — confirmar
con `git status` que no aparece listado).

---

## Task 9: Login, middleware y protección de `/dashboard`

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`
- Create: `src/infrastructure/auth/current-user.ts`

**Interfaces:**
- Consumes: `verificarToken`, `crearToken` (Task 8), `hashPassword`,
  `verifyPassword` (Task 8), `repository("usuarios")` (Task 3/6).
- Produces: `getCurrentUser(): Promise<SessionPayload | null>` (server-only,
  para usar en las páginas de tesorería de las Tasks 11-14); ruta `/login`
  funcional; `/dashboard/**` redirige a `/login` sin sesión válida.

- [ ] **Step 1: Middleware de protección**

Crear `src/middleware.ts`:

```ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verificarToken } from "@/infrastructure/auth/session"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value
  const payload = token ? verificarToken(token) : null
  if (!payload) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
  runtime: "nodejs",
}
```

`runtime: "nodejs"` es necesario porque `verificarToken` usa `node:crypto`
(no disponible en el runtime Edge por defecto). Si al correr `next dev` en
el Step 6 aparece un error indicando que ese runtime no es válido para
middleware en esta versión de Next, quitar la línea `runtime: "nodejs"` y
en su lugar mover la verificación de sesión a `getCurrentUser()` (Step 4)
llamado al inicio de cada `page.tsx` bajo `/dashboard` en vez de en
middleware — el resto del código de este task no cambia.

- [ ] **Step 2: Server action de login**

Crear `src/app/login/actions.ts`:

```ts
"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyPassword } from "@/infrastructure/auth/password"
import { crearToken } from "@/infrastructure/auth/session"
import { repository } from "@/infrastructure/container"

const DIA_MS = 24 * 60 * 60 * 1000

export async function login(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  const usuarios = await repository("usuarios").findBy({ email })
  const usuario = usuarios[0]
  if (!usuario || usuario.estado !== "activo" || !verifyPassword(password, usuario.passwordHash)) {
    return "Correo o contraseña incorrectos."
  }

  const token = crearToken({
    usuarioId: usuario.id,
    rol: usuario.rol,
    exp: Date.now() + 7 * DIA_MS,
  })
  const jar = await cookies()
  jar.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
  redirect("/dashboard/tesoreria")
}
```

- [ ] **Step 3: Página de login**

Crear `src/app/login/page.tsx`:

```tsx
"use client"

import { useActionState } from "react"
import { login } from "./actions"

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-background p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold">Iniciar sesión</h1>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: `getCurrentUser()` para server components**

Crear `src/infrastructure/auth/current-user.ts`:

```ts
import "server-only"
import { cookies } from "next/headers"
import { verificarToken, type SessionPayload } from "./session"

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get("session")?.value
  return token ? verificarToken(token) : null
}
```

- [ ] **Step 5: `tsc --noEmit`**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Probar contra `next dev`**

```bash
pnpm dev
```

En otra terminal:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/dashboard/tesoreria
```

Expected: `307` (o `308`) con `redirect_url` apuntando a `/login` — sin
cookie de sesión, la ruta protegida redirige. Detener `pnpm dev`
(`Ctrl+C`) antes de seguir (no dejarlo corriendo entre tasks).

- [ ] **Step 7: Commit**

```bash
git add src/middleware.ts src/app/login src/infrastructure/auth/current-user.ts
git commit -m "feat(auth): login, middleware de sesión y getCurrentUser"
```

---

## Task 10: Módulos genéricos — `categorias` y `cuentas`

**Files:**
- Modify: `src/presentation/config/modules.ts`
- Modify: `src/app/dashboard/[slug]/page.tsx`

**Interfaces:**
- Consumes: `ModuleConfig`, `FieldConfig` (ya existen); `CollectionName`
  ahora incluye `"categorias"` y `"cuentas"` (Task 3).
- Produces: `/dashboard/categorias` y `/dashboard/cuentas` funcionando vía
  el CRUD genérico existente (sin páginas a medida).

- [ ] **Step 1: Agregar los dos módulos**

En `src/presentation/config/modules.ts`, dentro del array `MODULES`,
agregar (el orden dentro del array no importa, pero agruparlos juntos
ayuda a la lectura — se puede agregar al final del array, antes del
cierre `]`):

```ts
  {
    slug: "categorias",
    collection: "categorias",
    title: "Categorías",
    singular: "Categoría",
    description: "Árbol de categorías de ingreso/egreso de tesorería.",
    group: "Tesorería",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        options: [
          { value: "ingreso", label: "Ingreso" },
          { value: "egreso", label: "Egreso" },
        ],
        required: true,
      },
      {
        name: "parentId",
        label: "Categoría padre",
        type: "reference",
        reference: { collection: "categorias", labelField: "nombre" },
        helper: "Vacío = categoría raíz.",
      },
      { name: "orden", label: "Orden", type: "number", required: true },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
  {
    slug: "cuentas",
    collection: "cuentas",
    title: "Cuentas",
    singular: "Cuenta",
    description: "Cuentas de tesorería: bancos, efectivo, persona y reserva.",
    group: "Tesorería",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        options: [
          { value: "banco", label: "Banco" },
          { value: "efectivo", label: "Efectivo" },
          { value: "persona", label: "Persona" },
          { value: "reserva", label: "Reserva" },
        ],
        required: true,
      },
      { name: "moneda", label: "Moneda", type: "text", required: true },
      { name: "saldoInicial", label: "Saldo inicial", type: "number", required: true },
      { name: "estado", label: "Estado", type: "select", options: estadoActivo },
    ],
  },
```

- [ ] **Step 2: `tsc --noEmit`**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Probar contra `next dev`**

```bash
pnpm dev
```

Iniciar sesión manualmente en `http://localhost:3000/login` no es posible
todavía (no hay usuarios — se crean en el Task 11). Por ahora solo
verificar que la ruta no rompe en build/type-check:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard/categorias
```

Expected: `307`/`308` (redirige a `/login`, esperado sin sesión — confirma
que la ruta existe y no tira 500). Detener `pnpm dev`.

- [ ] **Step 4: Commit**

```bash
git add src/presentation/config/modules.ts
git commit -m "feat(tesoreria): módulos genéricos categorias y cuentas"
```

---

## Task 11: Administración de usuarios (bespoke, admin-only)

`usuarios`/`usuarioCuentas` **no** usan el CRUD genérico: el form genérico
no tiene gancho para hashear password server-side antes de guardar, y
mostrar `passwordHash` como campo de texto en un form reusable sería
confuso e inseguro. En su lugar, página a medida bajo `/dashboard/tesoreria`
(igual que las otras piezas de este módulo).

**Files:**
- Create: `src/app/dashboard/tesoreria/usuarios/page.tsx`
- Create: `src/app/dashboard/tesoreria/usuarios/actions.ts`
- Modify: `src/app/dashboard/[slug]/page.tsx` (agregar `"tesoreria"` a
  `RESERVED`)

**Interfaces:**
- Consumes: `hashPassword` (Task 8), `getCurrentUser` (Task 9),
  `repository("usuarios")`, `repository("cuentas")`,
  `repository("usuarioCuentas")` (Task 3).
- Produces: `/dashboard/tesoreria/usuarios` — lista + alta de usuarios con
  asignación de cuentas para `rol=persona`.

- [ ] **Step 1: Reservar el slug `tesoreria`**

En `src/app/dashboard/[slug]/page.tsx`, agregar `"tesoreria"` al `Set`
`RESERVED`:

```ts
const RESERVED = new Set([
  "kardex",
  "costeo",
  "trazabilidad",
  "reportes",
  "mapa",
  "tesoreria",
])
```

- [ ] **Step 2: Server actions**

Crear `src/app/dashboard/tesoreria/usuarios/actions.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { hashPassword } from "@/infrastructure/auth/password"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { BusinessRuleError } from "@/core/domain/errors"

export async function crearUsuario(formData: FormData) {
  const actor = await getCurrentUser()
  if (!actor || actor.rol !== "admin") {
    throw new BusinessRuleError("Solo un administrador puede crear usuarios.")
  }

  const nombre = String(formData.get("nombre") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const rol = String(formData.get("rol") ?? "persona") as "admin" | "persona"
  const cuentaIds = formData.getAll("cuentaIds").map(String)

  if (!nombre || !email || password.length < 8) {
    throw new BusinessRuleError(
      "Nombre, correo y contraseña (mínimo 8 caracteres) son obligatorios.",
    )
  }

  const usuario = await repository("usuarios").create({
    nombre,
    email,
    passwordHash: hashPassword(password),
    rol,
    estado: "activo",
  })

  if (rol === "persona") {
    for (const cuentaId of cuentaIds) {
      await repository("usuarioCuentas").create({ usuarioId: usuario.id, cuentaId })
    }
  }

  revalidatePath("/dashboard/tesoreria/usuarios")
}
```

- [ ] **Step 3: Página**

Crear `src/app/dashboard/tesoreria/usuarios/page.tsx`:

```tsx
import { PageHeader } from "@/presentation/components/page-header"
import { repository } from "@/infrastructure/container"
import { crearUsuario } from "./actions"

export default async function UsuariosPage() {
  const [usuarios, cuentas, usuarioCuentas] = await Promise.all([
    repository("usuarios").findAll(),
    repository("cuentas").findAll(),
    repository("usuarioCuentas").findAll(),
  ])
  const cuentasPorUsuario = new Map<string, string[]>()
  for (const uc of usuarioCuentas) {
    const lista = cuentasPorUsuario.get(uc.usuarioId) ?? []
    lista.push(cuentas.find((c) => c.id === uc.cuentaId)?.nombre ?? uc.cuentaId)
    cuentasPorUsuario.set(uc.usuarioId, lista)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Acceso al sistema de tesorería: quién puede capturar qué cuenta."
        badge="Tesorería"
      />
      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-2">Nombre</th>
              <th className="p-2">Correo</th>
              <th className="p-2">Rol</th>
              <th className="p-2">Cuentas asignadas</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-2">{u.nombre}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.rol}</td>
                <td className="p-2">
                  {u.rol === "admin" ? "Todas" : (cuentasPorUsuario.get(u.id) ?? []).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={crearUsuario} className="max-w-lg space-y-3 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Nuevo usuario</h2>
        <input name="nombre" placeholder="Nombre" required className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Correo" required className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="password" type="password" placeholder="Contraseña (mín. 8 caracteres)" required minLength={8} className="w-full rounded-md border px-3 py-2 text-sm" />
        <select name="rol" className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="persona">Persona (solo sus cuentas)</option>
          <option value="admin">Admin (todas las cuentas)</option>
        </select>
        <fieldset className="space-y-1">
          <legend className="text-xs text-muted-foreground">Cuentas (solo aplica a rol persona)</legend>
          {cuentas.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="cuentaIds" value={c.id} />
              {c.nombre}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Crear usuario
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: `tsc --noEmit` y commit**

```bash
pnpm exec tsc --noEmit
git add src/app/dashboard/tesoreria/usuarios src/app/dashboard/[slug]/page.tsx
git commit -m "feat(tesoreria): administración de usuarios (bespoke, admin-only)"
```

---

## Task 12: Lista de cuentas con saldo + ledger por cuenta

**Files:**
- Create: `src/app/dashboard/tesoreria/page.tsx`
- Create: `src/app/dashboard/tesoreria/[cuentaId]/page.tsx`
- Create: `src/app/dashboard/tesoreria/[cuentaId]/actions.ts`

**Interfaces:**
- Consumes: `tesoreriaService()` (Task 6), `repository()` (Task 3),
  `getCurrentUser()` (Task 9), `formatDate`/`toDateInput` de
  `@/lib/dates`.
- Produces: `/dashboard/tesoreria` (lista de cuentas + saldo, filtrada por
  permiso), `/dashboard/tesoreria/[cuentaId]` (ledger + captura).

- [ ] **Step 1: Lista de cuentas**

Crear `src/app/dashboard/tesoreria/page.tsx`:

```tsx
import Link from "next/link"
import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository, tesoreriaService } from "@/infrastructure/container"

export default async function TesoreriaPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")

  const [cuentas, saldos] = await Promise.all([
    repository("cuentas").findAll(),
    tesoreriaService().saldosDeTodasLasCuentas(),
  ])

  let visibles = cuentas
  if (actor.rol === "persona") {
    const asignadas = await repository("usuarioCuentas").findBy({ usuarioId: actor.usuarioId })
    const permitidas = new Set(asignadas.map((a) => a.cuentaId))
    visibles = cuentas.filter((c) => permitidas.has(c.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tesorería"
        description="Cuentas, saldos y movimientos."
        badge="Tesorería"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/tesoreria/${c.id}`}
            className="rounded-xl border p-4 transition hover:border-primary"
          >
            <p className="text-xs text-muted-foreground">{c.tipo} · {c.moneda}</p>
            <p className="font-medium">{c.nombre}</p>
            <p className="mt-2 text-lg font-semibold">
              {(saldos[c.id] ?? 0).toLocaleString("es-MX", { style: "currency", currency: c.moneda })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Server action de captura**

Crear `src/app/dashboard/tesoreria/[cuentaId]/actions.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { BusinessRuleError } from "@/core/domain/errors"

export async function capturarMovimiento(cuentaId: string, formData: FormData) {
  const actor = await getCurrentUser()
  if (!actor) throw new BusinessRuleError("Sesión inválida.")

  if (actor.rol === "persona") {
    const asignadas = await repository("usuarioCuentas").findBy({ usuarioId: actor.usuarioId })
    if (!asignadas.some((a) => a.cuentaId === cuentaId)) {
      throw new BusinessRuleError("No tienes permiso sobre esta cuenta.")
    }
  }

  await repository("movimientos").create({
    cuentaId,
    fecha: String(formData.get("fecha")),
    direccion: String(formData.get("direccion")) as "entrada" | "salida",
    categoriaId: String(formData.get("categoriaId") ?? ""),
    monto: Number(formData.get("monto")),
    beneficiario: String(formData.get("beneficiario") ?? ""),
    referencia: String(formData.get("referencia") ?? ""),
    folio: String(formData.get("folio") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    traspasoId: "",
    creadoPor: actor.usuarioId,
  })

  revalidatePath(`/dashboard/tesoreria/${cuentaId}`)
  revalidatePath("/dashboard/tesoreria")
}
```

- [ ] **Step 3: Página de ledger**

Crear `src/app/dashboard/tesoreria/[cuentaId]/page.tsx`:

```tsx
import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { formatDate, toDateInput } from "@/lib/dates"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { calcularSaldo } from "@/core/application/tesoreria-calc"
import { capturarMovimiento } from "./actions"

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ cuentaId: string }>
}) {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  const { cuentaId } = await params

  const cuenta = await repository("cuentas").findById(cuentaId)
  if (!cuenta) notFound()

  if (actor.rol === "persona") {
    const asignadas = await repository("usuarioCuentas").findBy({ usuarioId: actor.usuarioId })
    if (!asignadas.some((a) => a.cuentaId === cuentaId)) notFound()
  }

  const [movimientos, categorias] = await Promise.all([
    repository("movimientos").findBy({ cuentaId }),
    repository("categorias").findAll(),
  ])
  const ordenados = [...movimientos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]))

  let saldoCorrido = cuenta.saldoInicial
  const filas = ordenados.map((m) => {
    saldoCorrido = calcularSaldo(saldoCorrido, [m])
    return { ...m, saldoCorrido }
  })

  const categoriasHoja = categorias.filter((c) => categorias.every((h) => h.parentId !== c.id))
  const capturarConCuenta = capturarMovimiento.bind(null, cuentaId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={cuenta.nombre} description={`${cuenta.tipo} · ${cuenta.moneda}`} badge="Tesorería" />

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-2">Fecha</th>
              <th className="p-2">Categoría</th>
              <th className="p-2">Beneficiario</th>
              <th className="p-2 text-right">Entrada</th>
              <th className="p-2 text-right">Salida</th>
              <th className="p-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b bg-muted/20">
              <td className="p-2" colSpan={5}>Saldo inicial</td>
              <td className="p-2 text-right">
                {cuenta.saldoInicial.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
              </td>
            </tr>
            {filas.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="p-2">{formatDate(m.fecha)}</td>
                <td className="p-2">{m.traspasoId ? "Traspaso" : nombreCategoria.get(m.categoriaId) ?? "—"}</td>
                <td className="p-2">{m.beneficiario || "—"}</td>
                <td className="p-2 text-right">
                  {m.direccion === "entrada" ? m.monto.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda }) : ""}
                </td>
                <td className="p-2 text-right">
                  {m.direccion === "salida" ? m.monto.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda }) : ""}
                </td>
                <td className="p-2 text-right">
                  {m.saldoCorrido.toLocaleString("es-MX", { style: "currency", currency: cuenta.moneda })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={capturarConCuenta} className="max-w-xl space-y-3 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Capturar movimiento</h2>
        <input name="fecha" type="date" defaultValue={toDateInput()} required className="w-full rounded-md border px-3 py-2 text-sm" />
        <select name="direccion" required className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
        </select>
        <select name="categoriaId" required className="w-full rounded-md border px-3 py-2 text-sm">
          {categoriasHoja.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <input name="monto" type="number" step="0.01" min="0.01" required placeholder="Monto" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="beneficiario" placeholder="Beneficiario" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="referencia" placeholder="Referencia" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="folio" placeholder="Folio" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="descripcion" placeholder="Descripción" className="w-full rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Guardar
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: `tsc --noEmit` y commit**

```bash
pnpm exec tsc --noEmit
git add src/app/dashboard/tesoreria/page.tsx src/app/dashboard/tesoreria/[cuentaId]
git commit -m "feat(tesoreria): lista de cuentas con saldo y ledger por cuenta"
```

---

## Task 13: Página de traspasos

**Files:**
- Create: `src/app/dashboard/tesoreria/traspasos/page.tsx`
- Create: `src/app/dashboard/tesoreria/traspasos/actions.ts`

**Interfaces:**
- Consumes: `crearTraspaso` (Task 7), `getCurrentUser` (Task 9),
  `repository("cuentas")` (Task 3).

- [ ] **Step 1: Server action**

Crear `src/app/dashboard/tesoreria/traspasos/actions.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { crearTraspaso } from "@/infrastructure/container"
import { BusinessRuleError } from "@/core/domain/errors"

export async function registrarTraspaso(formData: FormData) {
  const actor = await getCurrentUser()
  if (!actor) throw new BusinessRuleError("Sesión inválida.")

  await crearTraspaso({
    fecha: String(formData.get("fecha")),
    cuentaOrigenId: String(formData.get("cuentaOrigenId")),
    cuentaDestinoId: String(formData.get("cuentaDestinoId")),
    monto: Number(formData.get("monto")),
    referencia: String(formData.get("referencia") ?? ""),
    creadoPor: actor.usuarioId,
  })

  revalidatePath("/dashboard/tesoreria")
}
```

- [ ] **Step 2: Página**

Crear `src/app/dashboard/tesoreria/traspasos/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { toDateInput } from "@/lib/dates"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import { registrarTraspaso } from "./actions"

export default async function TraspasosPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  if (actor.rol !== "admin") redirect("/dashboard/tesoreria")

  const cuentas = await repository("cuentas").findAll()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Traspasos" description="Mover dinero entre dos cuentas en un solo paso." badge="Tesorería" />
      <form action={registrarTraspaso} className="max-w-xl space-y-3 rounded-xl border p-4">
        <input name="fecha" type="date" defaultValue={toDateInput()} required className="w-full rounded-md border px-3 py-2 text-sm" />
        <select name="cuentaOrigenId" required className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="">Cuenta origen…</option>
          {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select name="cuentaDestinoId" required className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="">Cuenta destino…</option>
          {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="monto" type="number" step="0.01" min="0.01" required placeholder="Monto" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="referencia" placeholder="Referencia" className="w-full rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Registrar traspaso
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: `tsc --noEmit` y commit**

```bash
pnpm exec tsc --noEmit
git add src/app/dashboard/tesoreria/traspasos
git commit -m "feat(tesoreria): página de traspasos entre cuentas"
```

---

## Task 14: Reporte — matriz mensual

**Files:**
- Create: `src/app/dashboard/tesoreria/reportes/mensual/page.tsx`

**Interfaces:**
- Consumes: `tesoreriaService().reporteMensual()` (Task 6),
  `repository("cuentas")` (Task 3).

- [ ] **Step 1: Página**

Crear `src/app/dashboard/tesoreria/reportes/mensual/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository, tesoreriaService } from "@/infrastructure/container"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default async function ReporteMensualPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>
}) {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  if (actor.rol !== "admin") redirect("/dashboard/tesoreria")

  const sp = await searchParams
  const hoy = new Date()
  const mes = Number(sp.mes ?? hoy.getUTCMonth() + 1)
  const anio = Number(sp.anio ?? hoy.getUTCFullYear())

  const [matriz, cuentas] = await Promise.all([
    tesoreriaService().reporteMensual(mes, anio),
    repository("cuentas").findAll(),
  ])

  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Matriz mensual" description="Categoría × cuenta, con totales." badge="Tesorería" />

      <form className="flex gap-2" method="get">
        <select name="mes" defaultValue={mes} className="rounded-md border px-3 py-2 text-sm">
          {MESES.map((nombre, i) => (
            <option key={nombre} value={i + 1}>{nombre}</option>
          ))}
        </select>
        <input name="anio" type="number" defaultValue={anio} className="w-28 rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Ver
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="sticky left-0 bg-muted/40 p-2">Categoría</th>
              {cuentas.map((c) => (
                <th key={c.id} className="p-2 text-right whitespace-nowrap">{c.nombre}</th>
              ))}
              <th className="p-2 text-right whitespace-nowrap font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {matriz.filas.map((f) => (
              <tr key={f.categoriaId} className="border-b last:border-0">
                <td
                  className="sticky left-0 bg-background p-2 whitespace-nowrap"
                  style={{ paddingLeft: `${8 + f.nivel * 16}px`, fontWeight: f.nivel === 0 ? 600 : 400 }}
                >
                  {f.nombre}
                </td>
                {cuentas.map((c) => (
                  <td key={c.id} className="p-2 text-right">
                    {f.porCuenta[c.id] ? fmt(f.porCuenta[c.id]) : "—"}
                  </td>
                ))}
                <td className="p-2 text-right font-medium">{fmt(f.total)}</td>
              </tr>
            ))}
            <tr className="border-t-2 font-semibold">
              <td className="sticky left-0 bg-background p-2">Total</td>
              {cuentas.map((c) => (
                <td key={c.id} className="p-2 text-right">{fmt(matriz.totalesPorCuenta[c.id] ?? 0)}</td>
              ))}
              <td className="p-2 text-right">{fmt(matriz.totalGeneral)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `tsc --noEmit` y probar contra `next dev`**

```bash
pnpm exec tsc --noEmit
pnpm dev
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/dashboard/tesoreria/reportes/mensual"
```

Expected: `307`/`308` a `/login` (sin sesión) — confirma que la ruta
compila y responde. Detener `pnpm dev`.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/tesoreria/reportes
git commit -m "feat(tesoreria): reporte de matriz mensual (categoría × cuenta)"
```

---

## Task 15: Import histórico desde el Excel

**Files:**
- Create: `scripts/import-tesoreria.ts`
- Modify: `.gitignore`
- Move: `public/Control de Ingresos y Egresos 2025 V1.xlsx` →
  `scripts/data/control-ingresos-egresos-2025.xlsx`
- Modify: `package.json` (dependencia dev `xlsx`, script `db:import-tesoreria`)

**Interfaces:**
- Consumes: `flatConfigs`, `toRow` de `table-config.ts`; `generateId`,
  `nowDate` de `util.ts`; schema de Task 1. No usa `db` de `client.ts` ni
  `repository()` — crea su propia conexión Drizzle (ver Global
  Constraints), así corre con `tsx` plano.
- Produces: script ejecutable una sola vez que puebla `categorias`,
  `cuentas` y `movimientos` con el histórico real (22 cuentas, ~15,940
  movimientos).

- [ ] **Step 1: Sacar el archivo de `public/` (hallazgo de seguridad)**

`public/` se sirve como estático por Next.js — un archivo con saldos
bancarios reales, sueldos y gastos personales no debe vivir ahí.

```bash
mkdir -p scripts/data
git mv "public/Control de Ingresos y Egresos 2025 V1.xlsx" "scripts/data/control-ingresos-egresos-2025.xlsx"
```

Si el `git mv` falla porque el archivo no estaba trackeado (es el caso:
está `??` en `git status` desde antes de este proyecto), usar `mv` normal
en su lugar:

```bash
mv "public/Control de Ingresos y Egresos 2025 V1.xlsx" "scripts/data/control-ingresos-egresos-2025.xlsx"
```

Agregar a `.gitignore` (el archivo tiene datos financieros reales, no debe
commitearse):

```
scripts/data/*.xlsx
```

- [ ] **Step 2: Agregar dependencia de parseo**

```bash
pnpm add -D xlsx
```

- [ ] **Step 3: Escribir el script de import**

Crear `scripts/import-tesoreria.ts`:

```ts
import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import XLSX from "xlsx"
import * as schema from "@/infrastructure/persistence/sql/schema"
import { flatConfigs, toRow } from "@/infrastructure/persistence/sql/table-config"
import { generateId, nowDate } from "@/infrastructure/persistence/sql/util"

const ARCHIVO = "scripts/data/control-ingresos-egresos-2025.xlsx"

type TipoCuenta = "banco" | "efectivo" | "persona" | "reserva"

const CUENTAS: { hoja: string; tipo: TipoCuenta; moneda: string }[] = [
  { hoja: "MGZ121", tipo: "banco", moneda: "MXN" },
  { hoja: "MGZ BBVA", tipo: "banco", moneda: "MXN" },
  { hoja: "MGZ DOLARES", tipo: "banco", moneda: "USD" },
  { hoja: "MGZ BAJIO", tipo: "banco", moneda: "MXN" },
  { hoja: "VICTOR BANAMEX", tipo: "banco", moneda: "MXN" },
  { hoja: "VICTOR BANORTE", tipo: "banco", moneda: "MXN" },
  { hoja: "RODRIGO", tipo: "persona", moneda: "MXN" },
  { hoja: "MOY", tipo: "persona", moneda: "MXN" },
  { hoja: "NORMA RUTH", tipo: "persona", moneda: "MXN" },
  { hoja: "VALERIA", tipo: "persona", moneda: "MXN" },
  { hoja: "MANUEL BANAMEX", tipo: "persona", moneda: "MXN" },
  { hoja: "ROBERTO", tipo: "persona", moneda: "MXN" },
  { hoja: "JUAN", tipo: "persona", moneda: "MXN" },
  { hoja: "NORMA SANCHEZ", tipo: "persona", moneda: "MXN" },
  { hoja: "JOSE CARLOS", tipo: "persona", moneda: "MXN" },
  { hoja: "LUIS ENRIQUE ", tipo: "persona", moneda: "MXN" },
  { hoja: "CESARIA", tipo: "persona", moneda: "MXN" },
  { hoja: "ALAN", tipo: "persona", moneda: "MXN" },
  { hoja: "ELVIA", tipo: "persona", moneda: "MXN" },
  { hoja: "CAJA", tipo: "efectivo", moneda: "MXN" },
  { hoja: "CAJA TIGRES", tipo: "efectivo", moneda: "MXN" },
  { hoja: "RESERVA", tipo: "reserva", moneda: "MXN" },
]

// Taxonomía verificada fila por fila contra la hoja ENE25 del Excel.
// [nombre, tipo, padre|null, orden]
const CATEGORIAS: [string, "ingreso" | "egreso", string | null, number][] = [
  ["VENTA PIÑAS", "ingreso", null, 1],
  ["VENTA GANADO", "ingreso", null, 2],
  ["OTROS INGRESOS", "ingreso", null, 3],
  ["CABALLOS", "ingreso", null, 4],
  ["PRODUCTOS FINANCIEROS", "ingreso", null, 5],
  ["REMESAS", "ingreso", null, 6],
  ["REEMBOLSO", "ingreso", null, 7],
  ["VENTA EXTERNA", "ingreso", null, 8],
  ["VENTA POMELERO", "ingreso", null, 9],

  ["RAYA", "egreso", null, 10],
  ["RAYA MGZ", "egreso", "RAYA", 11],
  ["ANTICIPOS RAYA MGZ", "egreso", "RAYA", 12],
  ["RAYA GANADERIA", "egreso", "RAYA", 13],

  ["PRODUCCION", "egreso", null, 14],
  ["FERTILIZANTES Y AGROQUIMICOS", "egreso", "PRODUCCION", 15],
  ["ACOLCHADO PLASTICO", "egreso", "PRODUCCION", 16],
  ["MALLA SOMBRA", "egreso", "PRODUCCION", 17],
  ["CORTES Y FLETES", "egreso", "PRODUCCION", 18],
  ["COMPRA DE PIÑAS", "egreso", "PRODUCCION", 19],
  ["CORTES POMELERO", "egreso", "PRODUCCION", 20],
  ["PRESTAMO CHOFER", "egreso", "PRODUCCION", 21],

  ["OPERACION", "egreso", null, 22],
  ["SERVICIOS MECANICOS", "egreso", "OPERACION", 23],
  ["REFACCIONES MAQUINARIA Y VEHICULOS", "egreso", "OPERACION", 24],
  ["COMBUSTIBLE", "egreso", "OPERACION", 25],
  ["MATERIALES VARIOS", "egreso", "OPERACION", 26],
  ["GANADERIA", "egreso", "OPERACION", 27],
  ["RIEGO Y POZOS", "egreso", "OPERACION", 28],
  ["ENERGIA ELECTRICA, AGUA, GAS Y OXIGENO GRUPOS", "egreso", "OPERACION", 29],
  ["TELEFONOS", "egreso", "OPERACION", 30],
  ["VARIOS OPERACIÓN", "egreso", "OPERACION", 31],
  ["TENENCIAS", "egreso", "OPERACION", 32],
  ["SEGUROS CAMPO", "egreso", "OPERACION", 33],
  ["MMTO EQUIPOS ", "egreso", "OPERACION", 34],
  ["LLANTAS Y SERVICIOS ALINEACION-BALANCEO", "egreso", "OPERACION", 35],
  ["LAVADO Y ENGRASADO VEHICULOS", "egreso", "OPERACION", 36],
  ["RENTA TIERRAS", "egreso", "OPERACION", 37],
  ["ARRENDAMIENTO OFICINA/BODEGA", "egreso", "OPERACION", 38],
  ["MTTO INSTALACIONES", "egreso", "OPERACION", 39],
  ["DESCARGA DE PRODUCTOS", "egreso", "OPERACION", 40],
  ["PERDIDA EN VENTA FRUTA", "egreso", "OPERACION", 41],

  ["ADMINISTRATIVO", "egreso", null, 42],
  ["ASESORIAS", "egreso", "ADMINISTRATIVO", 43],
  ["SIPARE/IMSS", "egreso", "ADMINISTRATIVO", 44],
  ["IMPUESTO ESTATAL", "egreso", "ADMINISTRATIVO", 45],
  ["TELEFONOS/INTERNET", "egreso", "ADMINISTRATIVO", 46],
  ["LUZ/AGUA", "egreso", "ADMINISTRATIVO", 47],
  ["VARIOS ADMINISTRACION", "egreso", "ADMINISTRATIVO", 48],
  ["MTTO EQUIPO DE OFICINA", "egreso", "ADMINISTRATIVO", 49],
  ["ARRENDAMIENTO OFICINA", "egreso", "ADMINISTRATIVO", 50],
  ["VIATICOS", "egreso", "ADMINISTRATIVO", 51],
  ["LAVADO Y ENGRASADO VEHICULOS ADMTVO", "egreso", "ADMINISTRATIVO", 52],

  ["FINANCIERO", "egreso", null, 53],
  ["COMISION BANCARIA", "egreso", "FINANCIERO", 54],
  ["INTERES BANCARIO", "egreso", "FINANCIERO", 55],
  ["INTERES EXTERNO", "egreso", "FINANCIERO", 56],

  ["ACTIVOS", "egreso", null, 57],
  ["VEHICULOS TRABAJO", "egreso", "ACTIVOS", 58],
  ["TERRENOS", "egreso", "ACTIVOS", 59],
  ["AIRE ACONDICIONADO", "egreso", "ACTIVOS", 60],
  ["EQUIPOS DIVERSOS", "egreso", "ACTIVOS", 61],

  ["IMPUESTOS RAIZ", "egreso", null, 62],
  ["IMPUESTOS", "egreso", "IMPUESTOS RAIZ", 63],

  ["EXTERNA", "egreso", null, 64],
  ["DEV. VENTA EXTERNA", "egreso", "EXTERNA", 65],

  ["PRESTAMOS", "egreso", null, 66],
  ["BANCARIOS", "egreso", "PRESTAMOS", 67],
  ["EXTERNOS", "egreso", "PRESTAMOS", 68],
  ["TRABAJADORES", "egreso", "PRESTAMOS", 69],
  ["SOCIOS", "egreso", "PRESTAMOS", 70],

  ["TRASPASO", "egreso", null, 71],
  ["TRASPASO MGZ121", "egreso", "TRASPASO", 72],
  ["TRASPASO MGZBBVA", "egreso", "TRASPASO", 73],
  ["TRASPASO MGZ DOLARES", "egreso", "TRASPASO", 74],
  ["TRASPASO MGZ BAJIO", "egreso", "TRASPASO", 75],
  ["TRASPASO VICTOR BANAMEX", "egreso", "TRASPASO", 76],
  ["TRASPASO VICTOR BANORTE", "egreso", "TRASPASO", 77],
  ["TRASPASO VICTOR BANCOMER", "egreso", "TRASPASO", 78],
  ["TRASPASO RODRIGO", "egreso", "TRASPASO", 79],
  ["TRASPASO MOY", "egreso", "TRASPASO", 80],
  ["TRASPASO NORMA RUTH", "egreso", "TRASPASO", 81],
  ["TRASPASO VALERIA", "egreso", "TRASPASO", 82],
  ["TRASPASO MANUEL BANAMEX", "egreso", "TRASPASO", 83],
  ["TRASPASO ROBERTO", "egreso", "TRASPASO", 84],
  ["TRASPASO LUIS ENRIQUE ", "egreso", "TRASPASO", 85],
  ["TRASPASO PEDRO C", "egreso", "TRASPASO", 86],
  ["TRASPASO JUAN", "egreso", "TRASPASO", 87],
  ["TRASPASO NORMA SANCHEZ", "egreso", "TRASPASO", 88],
  ["TRASPASO JOSE CARLOS", "egreso", "TRASPASO", 89],
  ["TRASPASO CESARIA", "egreso", "TRASPASO", 90],
  ["TRASPASO ALAN", "egreso", "TRASPASO", 91],
  ["TRASPASO ELVIA", "egreso", "TRASPASO", 92],
  ["TRASPASO CAJA", "egreso", "TRASPASO", 93],
  ["TRASPASO CAJA TIGRES", "egreso", "TRASPASO", 94],
  ["RESERVAS", "egreso", "TRASPASO", 95],

  ["PERSONALES", "egreso", null, 96],
  ["VICTOR", "egreso", "PERSONALES", 97],
  ["NORMA", "egreso", "PERSONALES", 98],
  ["RODRIGO PERSONAL", "egreso", "PERSONALES", 99],
  ["MOISES", "egreso", "PERSONALES", 100],
  ["VALERIA PERSONAL", "egreso", "PERSONALES", 101],
  ["FUTBOL/BEISBOL", "egreso", "PERSONALES", 102],
  ["CABALLOS PERSONAL", "egreso", "PERSONALES", 103],

  ["FAMILIAS", "egreso", null, 104],
  ["APOYO FAMILIA", "egreso", "FAMILIAS", 105],
  ["APOYO TERCEROS", "egreso", "FAMILIAS", 106],
  ["PAGOS FAMILIA", "egreso", "FAMILIAS", 107],
  ["SEGUROS Y BECAS", "egreso", "FAMILIAS", 108],
  ["PRESTAMO CASA CORDOVA", "egreso", "FAMILIAS", 109],
  ["SEGURO CASA CORDOVA", "egreso", "FAMILIAS", 110],
  ["INTERES CASA CORDOVA", "egreso", "FAMILIAS", 111],
  ["VEHICULOS PERSONALES", "egreso", "FAMILIAS", 112],
]

// El Excel usa el mismo texto "RODRIGO"/"VALERIA"/"CABALLOS" para una
// cuenta o categoría raíz de ingreso Y para una subcategoría de PERSONALES.
// Se renombran las hojas de PERSONALES en el import (columna J del ledger
// sigue diciendo "RODRIGO" tal cual — el mapeo de texto→categoría de abajo
// traduce explícitamente esos 3 casos ambiguos al nombre "renombrado").
const ALIAS_CONCEPTO: Record<string, string> = {
  RODRIGO: "RODRIGO PERSONAL",
  VALERIA: "VALERIA PERSONAL",
  CABALLOS: "CABALLOS PERSONAL",
}

function normaliza(texto: string): string {
  return texto.trim().toUpperCase()
}

function excelFechaAISO(valor: unknown): string {
  if (valor instanceof Date) return valor.toISOString()
  return new Date(String(valor)).toISOString()
}

function monto(valor: unknown): number {
  const limpio = String(valor ?? "0").replace(/[$,\s]/g, "")
  const n = Number.parseFloat(limpio)
  return Number.isNaN(n) ? 0 : n
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })
  const now = nowDate()

  const wb = XLSX.readFile(ARCHIVO, { cellDates: true, raw: false })

  // 1. Categorías (padres antes que hijos).
  const idPorNombreCategoria = new Map<string, string>()
  const raices = CATEGORIAS.filter(([, , padre]) => padre === null)
  const hijos = CATEGORIAS.filter(([, , padre]) => padre !== null)
  const filasCategorias: (typeof schema.categorias.$inferInsert)[] = []
  for (const [nombre, tipo, , orden] of raices) {
    const id = generateId("categorias")
    idPorNombreCategoria.set(nombre, id)
    filasCategorias.push({
      id, nombre, tipo, parentId: null, orden, estado: "activo",
      createdAt: now, updatedAt: now,
    })
  }
  for (const [nombre, tipo, padre, orden] of hijos) {
    const id = generateId("categorias")
    idPorNombreCategoria.set(nombre, id)
    filasCategorias.push({
      id, nombre, tipo, parentId: idPorNombreCategoria.get(padre!) ?? null,
      orden, estado: "activo", createdAt: now, updatedAt: now,
    })
  }
  await db.insert(schema.categorias).values(filasCategorias)
  console.log(`Categorías importadas: ${filasCategorias.length}`)

  // Índice CONCEPTO normalizado -> { ingreso?: id, egreso?: id } (solo hojas).
  const hojasCategoria = new Set(hijos.map(([nombre]) => nombre))
  for (const [nombre] of raices) {
    // Una raíz sin hijos declarados en CATEGORIAS también es hoja (ingresos).
    if (!hijos.some(([, , padre]) => padre === nombre)) hojasCategoria.add(nombre)
  }
  const lookupCategoria = new Map<string, { ingreso?: string; egreso?: string }>()
  for (const [nombre, tipo] of CATEGORIAS) {
    if (!hojasCategoria.has(nombre)) continue
    const clave = normaliza(nombre)
    const entrada = lookupCategoria.get(clave) ?? {}
    entrada[tipo] = idPorNombreCategoria.get(nombre)
    lookupCategoria.set(clave, entrada)
  }

  function resuelveCategoriaId(conceptoCrudo: string, direccion: "entrada" | "salida"): string {
    const concepto = ALIAS_CONCEPTO[normaliza(conceptoCrudo)] ?? conceptoCrudo
    const clave = normaliza(concepto)
    const entrada = lookupCategoria.get(clave)
    if (!entrada) return ""
    return (direccion === "entrada" ? entrada.ingreso : entrada.egreso) ?? ""
  }

  // 2. Cuentas.
  const idPorCuenta = new Map<string, string>()
  const filasCuentas: (typeof schema.cuentas.$inferInsert)[] = []
  for (const { hoja, tipo, moneda } of CUENTAS) {
    const ws = wb.Sheets[hoja]
    if (!ws) throw new Error(`No se encontró la hoja "${hoja}" en el Excel.`)
    const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" })
    const saldoInicial = monto((filas[1] as unknown[])?.[14]) // columna O = SALDO
    const id = generateId("cuentas")
    idPorCuenta.set(hoja, id)
    filasCuentas.push({
      id, nombre: hoja.trim(), tipo, moneda, saldoInicial, estado: "activo",
      createdAt: now, updatedAt: now,
    })
  }
  await db.insert(schema.cuentas).values(filasCuentas)
  console.log(`Cuentas importadas: ${filasCuentas.length}`)

  // 3. Movimientos (todas las filas de datos de cada ledger, desde la fila 3
  // en adelante — la fila 2 es el SALDO INICIAL, ya capturado en cuentas.saldoInicial).
  let totalMovimientos = 0
  let sinCategoria = 0
  for (const { hoja } of CUENTAS) {
    const ws = wb.Sheets[hoja]
    const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" })
    const cuentaId = idPorCuenta.get(hoja)!
    const filasMovimiento: (typeof schema.movimientos.$inferInsert)[] = []

    for (let i = 2; i < filas.length; i++) {
      const fila = filas[i] as unknown[]
      const fecha = fila[0]
      const tipoFila = String(fila[7] ?? "").trim().toUpperCase()
      if (!fecha || (tipoFila !== "ENTRADA" && tipoFila !== "SALIDA")) continue

      const direccion = tipoFila === "ENTRADA" ? "entrada" : "salida"
      const concepto = String(fila[9] ?? "").trim()
      const montoFila = monto(direccion === "entrada" ? fila[12] : fila[13])
      if (montoFila === 0) continue

      const categoriaId = resuelveCategoriaId(concepto, direccion)
      if (!categoriaId) sinCategoria++

      filasMovimiento.push({
        id: generateId("movimientos"),
        cuentaId,
        fecha: new Date(excelFechaAISO(fecha)),
        direccion,
        categoriaId: categoriaId || null,
        monto: montoFila,
        beneficiario: String(fila[10] ?? "") || null,
        referencia: String(fila[11] ?? "") || null,
        folio: String(fila[2] ?? "") || null,
        descripcion: String(fila[4] ?? "") || null,
        traspasoId: null,
        creadoPor: null,
        createdAt: now,
        updatedAt: now,
      })
    }

    if (filasMovimiento.length > 0) {
      // Insertar en lotes de 500 (postgres tiene límite de parámetros por query).
      for (let i = 0; i < filasMovimiento.length; i += 500) {
        await db.insert(schema.movimientos).values(filasMovimiento.slice(i, i + 500))
      }
    }
    totalMovimientos += filasMovimiento.length
    console.log(`  ${hoja}: ${filasMovimiento.length} movimientos`)
  }

  console.log(`Total movimientos importados: ${totalMovimientos}`)
  console.log(`Movimientos sin categoría resuelta (categoriaId null): ${sinCategoria}`)

  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

Nota sobre `toRow`/`flatConfigs`: el script inserta directo con
`schema.categorias`/`schema.cuentas`/`schema.movimientos` (tipos
`$inferInsert` de Drizzle) en vez de pasar por `toRow`, porque ya construye
los `Date` nativos directamente — `toRow` solo hace falta cuando se parte
de la forma "entidad de dominio" (fechas en ISO string). Es más directo
así para un script de una sola corrida.

- [ ] **Step 2: Agregar el script a `package.json`**

En la sección `"scripts"`, agregar:

```json
    "db:import-tesoreria": "tsx scripts/import-tesoreria.ts"
```

- [ ] **Step 3: Correr el import**

```bash
pnpm db:up
pnpm db:import-tesoreria
```

Expected: imprime `Categorías importadas: 112`, `Cuentas importadas: 22`,
un renglón por hoja con su conteo de movimientos, y termina con
`Total movimientos importados: <N>` donde N está cerca de 15,940 (puede
variar unos cuantos por filas con monto 0 que se descartan a propósito).
`Movimientos sin categoría resuelta` debería ser 0 o muy bajo — si es alto,
revisar qué `CONCEPTO` del Excel no matchea ningún nombre de `CATEGORIAS`
(típicamente un typo o una categoría real que falta en la lista estática)
antes de seguir.

- [ ] **Step 4: Verificar contra un número real conocido del Excel**

El acumulado total disponible en bancos al cierre de enero 2025 (hoja
ENE25, fila "TOTAL DISPONIBLE PARA SIGUIENTE MES EN BANCOS") es
**$1,111,914.91**. Verificar que la suma de saldos de las 22 cuentas al 31
de enero de 2025 coincide:

```bash
npx tsx --conditions=react-server -e "
import('@/infrastructure/container').then(async ({ tesoreriaService, repository }) => {
  const cuentas = await repository('cuentas').findAll()
  const movs = await repository('movimientos').findAll()
  const { calcularSaldo } = await import('@/core/application/tesoreria-calc')
  let total = 0
  for (const c of cuentas) {
    const delMes = movs.filter((m) => m.cuentaId === c.id && m.fecha <= '2025-01-31T23:59:59.999Z')
    total += calcularSaldo(c.saldoInicial, delMes)
  }
  console.log('Total al 31-ene-2025:', total.toFixed(2))
})
"
```

Expected: `Total al 31-ene-2025: 1111914.91` (tolerancia de unos centavos
por redondeo es aceptable; una diferencia grande indica un error de mapeo
de categoría o de cuenta que hay que investigar antes de dar el import por
bueno).

- [ ] **Step 5: `tsc --noEmit` y commit**

```bash
pnpm exec tsc --noEmit
git add scripts/import-tesoreria.ts .gitignore package.json pnpm-lock.yaml
git commit -m "feat(tesoreria): import histórico del Excel (categorías, cuentas, movimientos)"
```

El archivo `.xlsx` movido a `scripts/data/` NO se agrega (`.gitignore` ya
lo excluye) — confirmar con `git status` que no aparece.

---

## Self-Review

**1. Cobertura del spec:**
- Modelo de datos (6 tablas + 4 enums) → Task 1-3. ✓
- Saldo calculado, no copiado → Task 4, 6. ✓
- Traspaso atómico (1 acción → 2 movimientos ligados) → Task 7. ✓
- Auth básico (login + rol, persona ve solo sus cuentas) → Task 8-9, 12
  (chequeo de `usuarioCuentas` en ledger page y en la action de captura).
  ✓
- Import histórico sin perder información, sin reconstruir pares de
  traspaso → Task 15 (categoriza TRASPASO X como categoría normal, no
  toca la tabla `traspasos`). ✓
- Matriz mensual con rollup jerárquico → Task 5, 14. ✓
- Corte 2026-07-03, Excel deja de capturarse → cubierto operativamente:
  después del Task 15 el import ya trajo todo el histórico disponible a la
  fecha; no hay una tarea de código adicional para "apagar" el Excel (es
  una decisión operativa del negocio, no una feature de software).
- Hallazgo de seguridad del spec (archivo en `public/`) → resuelto en
  Task 15 Step 1.

**2. Placeholders:** ninguno — cada step tiene código completo o un
comando con output esperado explícito.

**3. Consistencia de tipos:** `calcularSaldo` (Task 4) tiene la misma
firma en `tesoreria-calc.ts` y en su uso desde `TesoreriaService` (Task 6)
y desde la página de ledger (Task 12). `crearTraspaso`/`CrearTraspasoInput`
(Task 7) se usa con los mismos nombres de campo en la action de traspasos
(Task 13). `Movimiento`/`Categoria`/`Cuenta`/`Traspaso`/`Usuario` (Task 3)
son los mismos tipos consumidos en Tasks 4-15 sin duplicarse.

---

## Execution Handoff

Plan completo, guardado en `docs/superpowers/plans/2026-07-03-nucleo-tesoreria.md`.
