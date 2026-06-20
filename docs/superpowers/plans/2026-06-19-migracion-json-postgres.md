# Migración persistencia JSON → PostgreSQL — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el adaptador de persistencia de archivo JSON por uno de PostgreSQL con Drizzle ORM, sin cambiar dominio/aplicación/presentación salvo `findWhere`→`findBy`.

**Architecture:** Arquitectura hexagonal ya existente. Se añade un adaptador SQL que implementa los puertos `Repository<T>`/`UnitOfWork`. Repos genéricos dirigidos por configuración (un `DrizzleRepository` para 12 tablas planas, un `AggregateRepository` para 5 agregados con líneas), seleccionados por `SqlUnitOfWork`. El composition root elige driver por flag `DB_DRIVER`.

**Tech Stack:** Next.js 16, TypeScript 5.7, Drizzle ORM, postgres.js, PostgreSQL 17 (Docker), tsx, pnpm.

**Spec:** [docs/superpowers/specs/2026-06-19-migracion-json-postgres-design.md](../specs/2026-06-19-migracion-json-postgres-design.md)

## Global Constraints

- Gestor de paquetes: **pnpm** (nunca npm/yarn).
- **No** correr `next build` mientras `next dev` esté activo. Verificar tipos con `pnpm exec tsc --noEmit`.
- No hay framework de tests; verificación unitaria = scripts `tsx` con `assert`; verificación integración = tsc + conteos del seed + probes HTTP.
- El **shape de cada entidad** en [src/core/domain/entities.ts](../../../src/core/domain/entities.ts) NO cambia. Las fechas siguen siendo `string` ISO en el dominio.
- Numéricos no enteros usan `doublePrecision` (devuelve `number`); **nunca** `numeric` (devuelve `string` y rompe el contrato).
- IDs raíz: `text`, conservar los existentes. IDs de líneas: `serial`.
- Plataforma Windows: comandos `pnpm`/`docker`/`tsx`; shell PowerShell o Bash.

---

### Task 1: Cambio de contrato `findWhere` → `findBy`

Refactor independiente que mantiene el driver JSON funcionando. Lo hacemos primero para que todo compile antes de tocar SQL.

**Files:**
- Modify: [src/core/domain/repositories.ts](../../../src/core/domain/repositories.ts)
- Modify: [src/infrastructure/persistence/json-repository.ts](../../../src/infrastructure/persistence/json-repository.ts)
- Modify: [src/core/application/inventory-service.ts](../../../src/core/application/inventory-service.ts)
- Modify: [src/core/application/traceability-service.ts](../../../src/core/application/traceability-service.ts)
- Create: `scripts/check-findby.ts`

**Interfaces:**
- Produces: `Repository<T>.findBy(criteria: Partial<T>): Promise<T[]>` — devuelve filas donde TODAS las claves de `criteria` coinciden por igualdad estricta. Reemplaza a `findWhere`.

- [ ] **Step 1: Escribir el check que falla**

Create `scripts/check-findby.ts`:

```ts
import assert from "node:assert/strict"
import { JsonRepository } from "@/infrastructure/persistence/json-repository"
import type { MovimientoInventario } from "@/core/domain/entities"

async function main() {
  const repo = new JsonRepository<MovimientoInventario>("movimientosInventario")
  const all = await repo.findAll()
  const target = all[0]
  const byProducto = await repo.findBy({ productoId: target.productoId })
  assert.ok(byProducto.length > 0, "findBy debe devolver coincidencias")
  assert.ok(
    byProducto.every((m) => m.productoId === target.productoId),
    "todas las filas coinciden con el criterio",
  )
  const byTwo = await repo.findBy({ productoId: target.productoId, tipo: target.tipo })
  assert.ok(byTwo.every((m) => m.productoId === target.productoId && m.tipo === target.tipo))
  console.log("OK findBy:", byProducto.length, "filas")
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `pnpm exec tsx scripts/check-findby.ts`
Expected: FAIL — `repo.findBy is not a function`.

- [ ] **Step 3: Cambiar la firma del puerto**

En [src/core/domain/repositories.ts](../../../src/core/domain/repositories.ts) reemplazar la línea de `findWhere`:

```ts
  findById(id: string): Promise<T | null>
  /** Returns rows where every key in `criteria` matches by strict equality. */
  findBy(criteria: Partial<T>): Promise<T[]>
  create(data: NewEntity<T>): Promise<T>
```

- [ ] **Step 4: Implementar `findBy` en el adaptador JSON**

En [src/infrastructure/persistence/json-repository.ts](../../../src/infrastructure/persistence/json-repository.ts) reemplazar el método `findWhere` por:

```ts
  async findBy(criteria: Partial<T>): Promise<T[]> {
    const rows = await jsonDatastore.read<T>(this.collection)
    const entries = Object.entries(criteria) as [keyof T, unknown][]
    return rows.filter((row) => entries.every(([k, v]) => row[k] === v))
  }
```

- [ ] **Step 5: Migrar los 6 callers**

En [src/core/application/inventory-service.ts](../../../src/core/application/inventory-service.ts), las dos llamadas son igualdad pura. Reemplazar:

```ts
// método kardex(), línea 47
await this.movimientos.findBy({ productoId }),
```
```ts
// método existencia(), líneas 103-105
const movs = await this.movimientos.findBy({ productoId })
```

En [src/core/application/traceability-service.ts](../../../src/core/application/traceability-service.ts), método `trazar()`, las cuatro son igualdad pura:

```ts
// líneas 47-49
const [cot] = await this.cotizaciones.findBy({ requerimientoId: req.id })
// línea 60
? await this.ordenes.findBy({ proveedorId })
// línea 71
? await this.recepciones.findBy({ ordenCompraId: orden.id })
// línea 84
? await this.cuentas.findBy({ factura: recepcion.factura })
```

NO tocar la línea 95 (`this.vales.findAll().filter(...)`): no usa `findWhere` y filtra por `.some()` sobre líneas anidadas, que no es igualdad de columna.

- [ ] **Step 6: Verificar tipos y el check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.
Run: `pnpm exec tsx scripts/check-findby.ts`
Expected: `OK findBy: N filas`.

- [ ] **Step 7: Commit**

```bash
git add src/core/domain/repositories.ts src/infrastructure/persistence/json-repository.ts src/core/application/inventory-service.ts src/core/application/traceability-service.ts scripts/check-findby.ts
git commit -m "refactor: replace findWhere predicate with typed findBy criteria"
```

---

### Task 2: Tooling — deps, Docker, env, drizzle-kit

**Files:**
- Modify: [package.json](../../../package.json)
- Create: `docker-compose.yml`
- Create: `.env`
- Create: `.env.example`
- Modify: `.gitignore` (asegurar `.env` ignorado)
- Create: `drizzle.config.ts`
- Create: `src/infrastructure/persistence/sql/client.ts`
- Create: `scripts/check-db.ts`

**Interfaces:**
- Produces: `src/infrastructure/persistence/sql/client.ts` exporta `db` (instancia Drizzle) y `sql` (cliente postgres.js). Lee `process.env.DATABASE_URL`.

- [ ] **Step 1: Instalar dependencias (pnpm)**

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit tsx dotenv
```

- [ ] **Step 2: docker-compose.yml**

Create `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:17
    container_name: ams_pg
    restart: unless-stopped
    environment:
      POSTGRES_USER: ams
      POSTGRES_PASSWORD: ams_dev
      POSTGRES_DB: ams
    ports:
      - "5432:5432"
    volumes:
      - ams_pgdata:/var/lib/postgresql/data
volumes:
  ams_pgdata:
```

- [ ] **Step 3: Variables de entorno**

Create `.env`:

```
DATABASE_URL=postgres://ams:ams_dev@localhost:5432/ams
DB_DRIVER=sql
```

Create `.env.example` (mismo contenido sin valores sensibles):

```
DATABASE_URL=postgres://ams:ams_dev@localhost:5432/ams
DB_DRIVER=sql
```

Confirmar que `.gitignore` contiene `.env` (Next la incluye por defecto; añadir la línea si falta). NO commitear `.env`.

- [ ] **Step 4: drizzle.config.ts**

Create `drizzle.config.ts`:

```ts
import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/infrastructure/persistence/sql/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

- [ ] **Step 5: Cliente de conexión**

Create `src/infrastructure/persistence/sql/client.ts`:

```ts
import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL no definida")

// Reusar la conexión entre hot-reloads de Next en dev.
const globalForDb = globalThis as unknown as { _sql?: ReturnType<typeof postgres> }
export const sql = globalForDb._sql ?? postgres(connectionString, { max: 10 })
if (process.env.NODE_ENV !== "production") globalForDb._sql = sql

export const db = drizzle(sql, { schema })
```

Nota: `schema.ts` aún no existe; este archivo fallará al compilar hasta la Task 3. Eso es esperado; no se verifica tipos hasta entonces.

- [ ] **Step 6: Scripts en package.json**

Añadir a `"scripts"` en [package.json](../../../package.json):

```json
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx scripts/seed-sql.ts",
    "db:reset": "drizzle-kit migrate && tsx scripts/seed-sql.ts"
```

- [ ] **Step 7: Levantar Postgres y verificar conexión**

Create `scripts/check-db.ts`:

```ts
import "dotenv/config"
import postgres from "postgres"

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const [row] = await sql`select version()`
  console.log("OK conexión:", row.version)
  await sql.end()
}
main().catch((e) => { console.error(e); process.exit(1) })
```

Run:
```bash
pnpm db:up
pnpm exec tsx scripts/check-db.ts
```
Expected: `OK conexión: PostgreSQL 17...`. Si el contenedor tarda, reintentar el check tras unos segundos.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml docker-compose.yml .env.example drizzle.config.ts src/infrastructure/persistence/sql/client.ts scripts/check-db.ts .gitignore
git commit -m "chore: add postgres docker, drizzle tooling and db scripts"
```

---

### Task 3: Esquema Drizzle (`schema.ts`)

**Files:**
- Create: `src/infrastructure/persistence/sql/schema.ts`

**Interfaces:**
- Produces: tablas Drizzle exportadas con estos nombres TS (propiedades en camelCase, columnas en snake_case): `ranchos`, `parcelas`, `plantillas`, `ciclos`, `siembras`, `semilleros`, `actividades`, `registrosActividad`, `productos`, `proveedores`, `movimientosInventario`, `cuentasPorPagar`, `requerimientos`, `cotizaciones`, `ordenesCompra`, `recepciones`, `valesSalida`, y las hijas `detalleRequerimiento`, `detalleCotizacion`, `detalleOrdenCompra`, `detalleRecepcion`, `detalleVale`.

- [ ] **Step 1: Escribir el esquema completo**

Create `src/infrastructure/persistence/sql/schema.ts`:

```ts
import {
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
import type { GeoPolygon } from "@/core/domain/entities"

// --- Enums ---
export const estadoActivo = pgEnum("estado_activo", ["activo", "inactivo"])
export const estadoCiclo = pgEnum("estado_ciclo", ["planeado", "activo", "cosechado", "cerrado"])
export const estadoCotizacion = pgEnum("estado_cotizacion", ["pendiente", "cotizada", "comprada"])
export const estadoOrdenCompra = pgEnum("estado_orden_compra", ["borrador", "autorizada", "parcial", "surtida", "cancelada"])
export const estadoCuentaPorPagar = pgEnum("estado_cuenta_por_pagar", ["pendiente", "pagada", "vencida"])
export const tipoMovimiento = pgEnum("tipo_movimiento", ["entrada", "salida"])

// Columnas de auditoría compartidas.
const audit = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}

// 1. Estructura productiva
export const ranchos = pgTable("ranchos", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  estado: estadoActivo("estado").notNull(),
  ...audit,
})

export const parcelas = pgTable("parcelas", {
  id: text("id").primaryKey(),
  ranchoId: text("rancho_id").notNull().references(() => ranchos.id),
  identificador: text("identificador").notNull(),
  superficieM2: doublePrecision("superficie_m2").notNull(),
  estado: estadoActivo("estado").notNull(),
  esSemillero: boolean("es_semillero").notNull(),
  geometria: jsonb("geometria").$type<GeoPolygon | null>(),
  ...audit,
})

export const plantillas = pgTable("plantillas", {
  id: text("id").primaryKey(),
  parcelaId: text("parcela_id").notNull().references(() => parcelas.id),
  numero: text("numero").notNull(),
  superficieM2: doublePrecision("superficie_m2").notNull(),
  ...audit,
})

// 2. Ciclos
export const ciclos = pgTable("ciclos", {
  id: text("id").primaryKey(),
  parcelaId: text("parcela_id").notNull().references(() => parcelas.id),
  fechaInicio: timestamp("fecha_inicio", { withTimezone: true }).notNull(),
  fechaCosechaEstimada: timestamp("fecha_cosecha_estimada", { withTimezone: true }).notNull(),
  estado: estadoCiclo("estado").notNull(),
  ...audit,
})

export const siembras = pgTable("siembras", {
  id: text("id").primaryKey(),
  cicloId: text("ciclo_id").notNull().references(() => ciclos.id),
  plantillaId: text("plantilla_id").notNull().references(() => plantillas.id),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  cantidadPlantas: integer("cantidad_plantas").notNull(),
  costoUnitarioPlanta: doublePrecision("costo_unitario_planta").notNull(),
  ...audit,
})

// 3. Semilleros
export const semilleros = pgTable("semilleros", {
  id: text("id").primaryKey(),
  parcelaId: text("parcela_id").notNull().references(() => parcelas.id),
  fechaProduccion: timestamp("fecha_produccion", { withTimezone: true }).notNull(),
  costoManoObra: doublePrecision("costo_mano_obra").notNull(),
  costoInsumos: doublePrecision("costo_insumos").notNull(),
  costoMaquinaria: doublePrecision("costo_maquinaria").notNull(),
  plantasProducidas: integer("plantas_producidas").notNull(),
  ...audit,
})

// 4. Mano de obra
export const actividades = pgTable("actividades", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  ...audit,
})

export const registrosActividad = pgTable("registros_actividad", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  actividadId: text("actividad_id").notNull().references(() => actividades.id),
  ranchoId: text("rancho_id").notNull().references(() => ranchos.id),
  parcelaId: text("parcela_id").notNull().references(() => parcelas.id),
  plantillaId: text("plantilla_id").notNull().references(() => plantillas.id),
  cicloId: text("ciclo_id").notNull().references(() => ciclos.id),
  responsable: text("responsable").notNull(),
  cantidad: doublePrecision("cantidad").notNull(),
  costo: doublePrecision("costo").notNull(),
  ...audit,
})

// 5. Productos
export const productos = pgTable("productos", {
  id: text("id").primaryKey(),
  ingredienteActivo: text("ingrediente_activo").notNull(),
  nombreComercial: text("nombre_comercial").notNull(),
  presentacion: text("presentacion").notNull(),
  unidadMedida: text("unidad_medida").notNull(),
  ...audit,
})

// 6. Proveedores
export const proveedores = pgTable("proveedores", {
  id: text("id").primaryKey(),
  razonSocial: text("razon_social").notNull(),
  contacto: text("contacto").notNull(),
  telefonoPrincipal: text("telefono_principal").notNull(),
  telefonoSecundario: text("telefono_secundario").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  ...audit,
})

// 7. Inventario
export const movimientosInventario = pgTable("movimientos_inventario", {
  id: text("id").primaryKey(),
  productoId: text("producto_id").notNull().references(() => productos.id),
  tipo: tipoMovimiento("tipo").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  cantidad: doublePrecision("cantidad").notNull(),
  costoUnitario: doublePrecision("costo_unitario").notNull(),
  proveedorId: text("proveedor_id").notNull().references(() => proveedores.id),
  factura: text("factura").notNull(),
  destino: text("destino").notNull(),
  ...audit,
})

// 8. Requerimientos (+ líneas)
export const requerimientos = pgTable("requerimientos", {
  id: text("id").primaryKey(),
  folio: text("folio").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  solicitante: text("solicitante").notNull(),
  observaciones: text("observaciones").notNull(),
  ...audit,
})
export const detalleRequerimiento = pgTable("detalle_requerimiento", {
  id: serial("id").primaryKey(),
  requerimientoId: text("requerimiento_id").notNull().references(() => requerimientos.id, { onDelete: "cascade" }),
  productoId: text("producto_id").notNull().references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  unidadMedida: text("unidad_medida").notNull(),
})

// 9. Cotizaciones (+ líneas)
export const cotizaciones = pgTable("cotizaciones", {
  id: text("id").primaryKey(),
  requerimientoId: text("requerimiento_id").notNull().references(() => requerimientos.id),
  proveedorId: text("proveedor_id").notNull().references(() => proveedores.id),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  estado: estadoCotizacion("estado").notNull(),
  ...audit,
})
export const detalleCotizacion = pgTable("detalle_cotizacion", {
  id: serial("id").primaryKey(),
  cotizacionId: text("cotizacion_id").notNull().references(() => cotizaciones.id, { onDelete: "cascade" }),
  productoId: text("producto_id").notNull().references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  precioUnitario: doublePrecision("precio_unitario").notNull(),
})

// 10. Órdenes de compra (+ líneas)
export const ordenesCompra = pgTable("ordenes_compra", {
  id: text("id").primaryKey(),
  folio: text("folio").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  proveedorId: text("proveedor_id").notNull().references(() => proveedores.id),
  estado: estadoOrdenCompra("estado").notNull(),
  ...audit,
})
export const detalleOrdenCompra = pgTable("detalle_orden_compra", {
  id: serial("id").primaryKey(),
  ordenCompraId: text("orden_compra_id").notNull().references(() => ordenesCompra.id, { onDelete: "cascade" }),
  productoId: text("producto_id").notNull().references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  precioUnitario: doublePrecision("precio_unitario").notNull(),
})

// 11. Recepciones (+ líneas)
export const recepciones = pgTable("recepciones", {
  id: text("id").primaryKey(),
  ordenCompraId: text("orden_compra_id").notNull().references(() => ordenesCompra.id),
  factura: text("factura").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  ...audit,
})
export const detalleRecepcion = pgTable("detalle_recepcion", {
  id: serial("id").primaryKey(),
  recepcionId: text("recepcion_id").notNull().references(() => recepciones.id, { onDelete: "cascade" }),
  productoId: text("producto_id").notNull().references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  costoUnitario: doublePrecision("costo_unitario").notNull(),
})

// 12. Cuentas por pagar
export const cuentasPorPagar = pgTable("cuentas_por_pagar", {
  id: text("id").primaryKey(),
  proveedorId: text("proveedor_id").notNull().references(() => proveedores.id),
  factura: text("factura").notNull(),
  importe: doublePrecision("importe").notNull(),
  fechaVencimiento: timestamp("fecha_vencimiento", { withTimezone: true }).notNull(),
  estado: estadoCuentaPorPagar("estado").notNull(),
  ...audit,
})

// 13. Vales de salida (+ líneas)
export const valesSalida = pgTable("vales_salida", {
  id: text("id").primaryKey(),
  folio: text("folio").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  responsable: text("responsable").notNull(),
  ranchoId: text("rancho_id").notNull().references(() => ranchos.id),
  parcelaId: text("parcela_id").notNull().references(() => parcelas.id),
  plantillaId: text("plantilla_id").notNull().references(() => plantillas.id),
  cicloId: text("ciclo_id").notNull().references(() => ciclos.id),
  ...audit,
})
export const detalleVale = pgTable("detalle_vale", {
  id: serial("id").primaryKey(),
  valeSalidaId: text("vale_salida_id").notNull().references(() => valesSalida.id, { onDelete: "cascade" }),
  productoId: text("producto_id").notNull().references(() => productos.id),
  cantidad: doublePrecision("cantidad").notNull(),
  costoUnitario: doublePrecision("costo_unitario").notNull(),
})
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores (incluye `client.ts` de la Task 2, que ahora resuelve `./schema`).

- [ ] **Step 3: Generar y aplicar la migración**

Run:
```bash
pnpm db:generate
pnpm db:migrate
```
Expected: `db:generate` crea `drizzle/0000_*.sql` sin error; `db:migrate` aplica `No migrations ... pending` → todas aplicadas.

- [ ] **Step 4: Verificar que las tablas existen**

Run:
```bash
pnpm exec tsx -e "import 'dotenv/config'; import postgres from 'postgres'; const sql=postgres(process.env.DATABASE_URL); const r=await sql\`select count(*) from information_schema.tables where table_schema='public'\`; console.log('tablas:', r[0].count); await sql.end()"
```
Expected: `tablas: 23` (17 raíz + 5 hijas + tabla `__drizzle_migrations`).

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/persistence/sql/schema.ts drizzle/
git commit -m "feat: add drizzle postgres schema for all 17 collections"
```

---

### Task 4: Mapeo fila↔entidad dirigido por configuración (`row-mappers.ts`)

**Files:**
- Create: `src/infrastructure/persistence/sql/util.ts`
- Create: `src/infrastructure/persistence/sql/table-config.ts`
- Create: `scripts/check-mappers.ts`

**Interfaces:**
- Consumes: tablas de `schema.ts`.
- Produces:
  - `util.ts`: `generateId(collection: string): string`, `nowDate(): Date`.
  - `table-config.ts`:
    - `type DateField = string`
    - `interface FlatConfig { table: PgTable; dateFields: string[] }`
    - `interface AggConfig { table: PgTable; child: PgTable; parentFk: string; childDateFields: string[]; dateFields: string[] }`
    - `flatConfigs: Record<string, FlatConfig>` (12 entradas).
    - `aggConfigs: Record<string, AggConfig>` (5 entradas).
    - `toEntity<T>(row, dateFields): T` — convierte columnas `Date`→ISO string.
    - `toRow(data, dateFields): Record<string, unknown>` — convierte strings de fecha→`Date`.

- [ ] **Step 1: util.ts**

Create `src/infrastructure/persistence/sql/util.ts`:

```ts
export function generateId(collection: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${collection}-${Date.now().toString(36)}-${rand}`
}
export function nowDate(): Date {
  return new Date()
}
```

- [ ] **Step 2: table-config.ts**

Create `src/infrastructure/persistence/sql/table-config.ts`:

```ts
import type { PgTable } from "drizzle-orm/pg-core"
import * as s from "./schema"

const AUDIT = ["createdAt", "updatedAt"]

export interface FlatConfig {
  table: PgTable
  dateFields: string[]
}
export interface AggConfig {
  table: PgTable
  child: PgTable
  /** columna FK en la tabla hija que apunta al padre (propiedad TS). */
  parentFk: string
  dateFields: string[]
  childDateFields: string[]
}

export const flatConfigs: Record<string, FlatConfig> = {
  ranchos: { table: s.ranchos, dateFields: AUDIT },
  parcelas: { table: s.parcelas, dateFields: AUDIT },
  plantillas: { table: s.plantillas, dateFields: AUDIT },
  ciclos: { table: s.ciclos, dateFields: ["fechaInicio", "fechaCosechaEstimada", ...AUDIT] },
  siembras: { table: s.siembras, dateFields: ["fecha", ...AUDIT] },
  semilleros: { table: s.semilleros, dateFields: ["fechaProduccion", ...AUDIT] },
  actividades: { table: s.actividades, dateFields: AUDIT },
  registrosActividad: { table: s.registrosActividad, dateFields: ["fecha", ...AUDIT] },
  productos: { table: s.productos, dateFields: AUDIT },
  proveedores: { table: s.proveedores, dateFields: AUDIT },
  movimientosInventario: { table: s.movimientosInventario, dateFields: ["fecha", ...AUDIT] },
  cuentasPorPagar: { table: s.cuentasPorPagar, dateFields: ["fechaVencimiento", ...AUDIT] },
}

export const aggConfigs: Record<string, AggConfig> = {
  requerimientos: { table: s.requerimientos, child: s.detalleRequerimiento, parentFk: "requerimientoId", dateFields: ["fecha", ...AUDIT], childDateFields: [] },
  cotizaciones: { table: s.cotizaciones, child: s.detalleCotizacion, parentFk: "cotizacionId", dateFields: ["fecha", ...AUDIT], childDateFields: [] },
  ordenesCompra: { table: s.ordenesCompra, child: s.detalleOrdenCompra, parentFk: "ordenCompraId", dateFields: ["fecha", ...AUDIT], childDateFields: [] },
  recepciones: { table: s.recepciones, child: s.detalleRecepcion, parentFk: "recepcionId", dateFields: ["fecha", ...AUDIT], childDateFields: [] },
  valesSalida: { table: s.valesSalida, child: s.detalleVale, parentFk: "valeSalidaId", dateFields: ["fecha", ...AUDIT], childDateFields: [] },
}

/** Convierte una fila de Drizzle a entidad de dominio (Date → ISO string). */
export function toEntity<T>(row: Record<string, unknown>, dateFields: string[]): T {
  const out: Record<string, unknown> = { ...row }
  for (const f of dateFields) {
    const v = out[f]
    if (v instanceof Date) out[f] = v.toISOString()
  }
  return out as T
}

/** Convierte datos de dominio a fila insertable (ISO string → Date). */
export function toRow(
  data: Record<string, unknown>,
  dateFields: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data }
  for (const f of dateFields) {
    const v = out[f]
    if (typeof v === "string") out[f] = new Date(v)
  }
  return out
}
```

- [ ] **Step 3: Check de round-trip de mapeo**

Create `scripts/check-mappers.ts`:

```ts
import assert from "node:assert/strict"
import { toEntity, toRow } from "@/infrastructure/persistence/sql/table-config"

const iso = "2025-01-10T08:00:00.000Z"
const row = { id: "x", createdAt: new Date(iso), updatedAt: new Date(iso), nombre: "A" }
const entity = toEntity<{ createdAt: string }>(row, ["createdAt", "updatedAt"])
assert.equal(entity.createdAt, iso, "Date debe volverse ISO string")

const back = toRow({ createdAt: iso, nombre: "A" }, ["createdAt"])
assert.ok(back.createdAt instanceof Date, "ISO string debe volverse Date")
assert.equal((back.createdAt as Date).toISOString(), iso, "round-trip exacto")
console.log("OK mappers")
```

- [ ] **Step 4: Ejecutar y verificar tipos**

Run: `pnpm exec tsx scripts/check-mappers.ts`
Expected: `OK mappers`.
Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/persistence/sql/util.ts src/infrastructure/persistence/sql/table-config.ts scripts/check-mappers.ts
git commit -m "feat: add config-driven row<->entity mappers for sql adapter"
```

---

### Task 5: Repositorio genérico de tablas planas (`drizzle-repository.ts`)

**Files:**
- Create: `src/infrastructure/persistence/sql/drizzle-repository.ts`

**Interfaces:**
- Consumes: `db` (client.ts), `flatConfigs`, `toEntity`, `toRow` (table-config.ts), `generateId`, `nowDate` (util.ts).
- Produces: `class DrizzleRepository<T extends BaseEntity> implements Repository<T>`; constructor `(collection: string)`. Sólo válido para colecciones en `flatConfigs`.

- [ ] **Step 1: Implementar**

Create `src/infrastructure/persistence/sql/drizzle-repository.ts`:

```ts
import "server-only"
import { and, eq, getTableColumns } from "drizzle-orm"
import type { BaseEntity } from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import type { NewEntity, Repository, UpdateEntity } from "@/core/domain/repositories"
import { db } from "./client"
import { flatConfigs, toEntity, toRow } from "./table-config"
import { generateId, nowDate } from "./util"

export class DrizzleRepository<T extends BaseEntity> implements Repository<T> {
  private readonly cfg = flatConfigs[this.collection]
  constructor(private readonly collection: string) {
    if (!this.cfg) throw new Error(`Sin config plana para ${collection}`)
  }

  private cols() {
    return getTableColumns(this.cfg.table) as Record<string, unknown>
  }

  async findAll(): Promise<T[]> {
    const rows = await db.select().from(this.cfg.table)
    return rows.map((r) => toEntity<T>(r, this.cfg.dateFields))
  }

  async findById(id: string): Promise<T | null> {
    const idCol = this.cols().id as never
    const rows = await db.select().from(this.cfg.table).where(eq(idCol, id))
    const row = rows[0]
    return row ? toEntity<T>(row, this.cfg.dateFields) : null
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    const cols = this.cols()
    const conv = toRow(criteria as Record<string, unknown>, this.cfg.dateFields)
    const conds = Object.entries(conv).map(([k, v]) => eq(cols[k] as never, v as never))
    const rows = await db.select().from(this.cfg.table).where(and(...conds))
    return rows.map((r) => toEntity<T>(r, this.cfg.dateFields))
  }

  async create(data: NewEntity<T>): Promise<T> {
    const now = nowDate()
    const values = {
      ...toRow(data as Record<string, unknown>, this.cfg.dateFields),
      id: generateId(this.collection),
      createdAt: now,
      updatedAt: now,
    }
    const [row] = await db.insert(this.cfg.table).values(values as never).returning()
    return toEntity<T>(row, this.cfg.dateFields)
  }

  async update(id: string, data: UpdateEntity<T>): Promise<T> {
    const idCol = this.cols().id as never
    const values = {
      ...toRow(data as Record<string, unknown>, this.cfg.dateFields),
      updatedAt: nowDate(),
    }
    const [row] = await db
      .update(this.cfg.table)
      .set(values as never)
      .where(eq(idCol, id))
      .returning()
    if (!row) throw new NotFoundError(this.collection, id)
    return toEntity<T>(row, this.cfg.dateFields)
  }

  async delete(id: string): Promise<void> {
    const idCol = this.cols().id as never
    const rows = await db.delete(this.cfg.table).where(eq(idCol, id)).returning()
    if (rows.length === 0) throw new NotFoundError(this.collection, id)
  }

  async count(): Promise<number> {
    const rows = await db.select().from(this.cfg.table)
    return rows.length
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores. Si Drizzle se queja de los `as never` en `values`, mantener los casts mostrados (necesarios por la naturaleza dinámica del repo genérico).

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/persistence/sql/drizzle-repository.ts
git commit -m "feat: add generic drizzle repository for flat tables"
```

---

### Task 6: Repositorio de agregados con líneas (`aggregate-repository.ts`)

**Files:**
- Create: `src/infrastructure/persistence/sql/aggregate-repository.ts`

**Interfaces:**
- Consumes: `db`, `aggConfigs`, `toEntity`, `toRow`, `generateId`, `nowDate`.
- Produces: `class AggregateRepository<T extends BaseEntity> implements Repository<T>`; constructor `(collection: string)`. Hidrata `detalles[]` en lectura; escribe padre+hijos en transacción. Sólo válido para colecciones en `aggConfigs`.

- [ ] **Step 1: Implementar**

Create `src/infrastructure/persistence/sql/aggregate-repository.ts`:

```ts
import "server-only"
import { and, eq, getTableColumns, inArray } from "drizzle-orm"
import type { BaseEntity } from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import type { NewEntity, Repository, UpdateEntity } from "@/core/domain/repositories"
import { db } from "./client"
import { aggConfigs, toEntity, toRow } from "./table-config"
import { generateId, nowDate } from "./util"

type WithDetalles = BaseEntity & { detalles: Record<string, unknown>[] }

export class AggregateRepository<T extends BaseEntity> implements Repository<T> {
  private readonly cfg = aggConfigs[this.collection]
  constructor(private readonly collection: string) {
    if (!this.cfg) throw new Error(`Sin config de agregado para ${collection}`)
  }

  private parentCols() {
    return getTableColumns(this.cfg.table) as Record<string, unknown>
  }
  private childCols() {
    return getTableColumns(this.cfg.child) as Record<string, unknown>
  }

  /** Quita id/fk de la fila hija para exponer sólo los campos de la línea. */
  private stripLine(childRow: Record<string, unknown>): Record<string, unknown> {
    const { id: _id, [this.cfg.parentFk]: _fk, ...line } = childRow
    void _id
    void _fk
    return line
  }

  private async hydrate(parentRows: Record<string, unknown>[]): Promise<T[]> {
    if (parentRows.length === 0) return []
    const ids = parentRows.map((r) => r.id as string)
    const fkCol = this.childCols()[this.cfg.parentFk] as never
    const childRows = await db.select().from(this.cfg.child).where(inArray(fkCol, ids))
    const byParent = new Map<string, Record<string, unknown>[]>()
    for (const c of childRows) {
      const key = (c as Record<string, unknown>)[this.cfg.parentFk] as string
      const list = byParent.get(key) ?? []
      list.push(this.stripLine(c as Record<string, unknown>))
      byParent.set(key, list)
    }
    return parentRows.map((p) => {
      const entity = toEntity<WithDetalles>(p, this.cfg.dateFields)
      entity.detalles = byParent.get(p.id as string) ?? []
      return entity as unknown as T
    })
  }

  async findAll(): Promise<T[]> {
    const rows = await db.select().from(this.cfg.table)
    return this.hydrate(rows)
  }

  async findById(id: string): Promise<T | null> {
    const idCol = this.parentCols().id as never
    const rows = await db.select().from(this.cfg.table).where(eq(idCol, id))
    const [hydrated] = await this.hydrate(rows)
    return hydrated ?? null
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    const cols = this.parentCols()
    // Sólo se filtra por columnas del padre (las líneas no son criterio).
    const conv = toRow(criteria as Record<string, unknown>, this.cfg.dateFields)
    const conds = Object.entries(conv)
      .filter(([k]) => k in cols)
      .map(([k, v]) => eq(cols[k] as never, v as never))
    const rows = conds.length
      ? await db.select().from(this.cfg.table).where(and(...conds))
      : await db.select().from(this.cfg.table)
    return this.hydrate(rows)
  }

  async create(data: NewEntity<T>): Promise<T> {
    const now = nowDate()
    const id = generateId(this.collection)
    const { detalles = [], ...parent } = data as unknown as WithDetalles
    const parentValues = {
      ...toRow(parent as Record<string, unknown>, this.cfg.dateFields),
      id,
      createdAt: now,
      updatedAt: now,
    }
    await db.transaction(async (tx) => {
      await tx.insert(this.cfg.table).values(parentValues as never)
      if (detalles.length > 0) {
        const childValues = detalles.map((d) => ({ ...d, [this.cfg.parentFk]: id }))
        await tx.insert(this.cfg.child).values(childValues as never)
      }
    })
    const created = await this.findById(id)
    if (!created) throw new NotFoundError(this.collection, id)
    return created
  }

  async update(id: string, data: UpdateEntity<T>): Promise<T> {
    const idCol = this.parentCols().id as never
    const fkCol = this.childCols()[this.cfg.parentFk] as never
    const { detalles, ...parent } = data as Partial<WithDetalles>
    const parentValues = {
      ...toRow(parent as Record<string, unknown>, this.cfg.dateFields),
      updatedAt: nowDate(),
    }
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(this.cfg.table)
        .set(parentValues as never)
        .where(eq(idCol, id))
        .returning()
      if (updated.length === 0) throw new NotFoundError(this.collection, id)
      // Reemplazo total de las líneas si se proporcionan.
      if (detalles !== undefined) {
        await tx.delete(this.cfg.child).where(eq(fkCol, id))
        if (detalles.length > 0) {
          const childValues = detalles.map((d) => ({ ...d, [this.cfg.parentFk]: id }))
          await tx.insert(this.cfg.child).values(childValues as never)
        }
      }
    })
    const result = await this.findById(id)
    if (!result) throw new NotFoundError(this.collection, id)
    return result
  }

  async delete(id: string): Promise<void> {
    const idCol = this.parentCols().id as never
    // FK ON DELETE CASCADE elimina las líneas hijas.
    const rows = await db.delete(this.cfg.table).where(eq(idCol, id)).returning()
    if (rows.length === 0) throw new NotFoundError(this.collection, id)
  }

  async count(): Promise<number> {
    const rows = await db.select().from(this.cfg.table)
    return rows.length
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/persistence/sql/aggregate-repository.ts
git commit -m "feat: add aggregate repository with transactional parent+lines"
```

---

### Task 7: Unit of Work SQL + selección de driver en el container

**Files:**
- Create: `src/infrastructure/persistence/sql/sql-unit-of-work.ts`
- Modify: [src/infrastructure/container.ts](../../../src/infrastructure/container.ts)

**Interfaces:**
- Consumes: `DrizzleRepository`, `AggregateRepository`, `aggConfigs`.
- Produces: `class SqlUnitOfWork implements UnitOfWork` — `repository(collection)` devuelve `AggregateRepository` si la colección está en `aggConfigs`, si no `DrizzleRepository`; cachea una instancia por colección.

- [ ] **Step 1: SqlUnitOfWork**

Create `src/infrastructure/persistence/sql/sql-unit-of-work.ts`:

```ts
import "server-only"
import type { BaseEntity } from "@/core/domain/entities"
import type { Repository, UnitOfWork } from "@/core/domain/repositories"
import { AggregateRepository } from "./aggregate-repository"
import { DrizzleRepository } from "./drizzle-repository"
import { aggConfigs } from "./table-config"

export class SqlUnitOfWork implements UnitOfWork {
  private readonly repos = new Map<string, Repository<BaseEntity>>()

  repository<T extends BaseEntity>(collection: string): Repository<T> {
    let repo = this.repos.get(collection)
    if (!repo) {
      repo =
        collection in aggConfigs
          ? new AggregateRepository<BaseEntity>(collection)
          : new DrizzleRepository<BaseEntity>(collection)
      this.repos.set(collection, repo)
    }
    return repo as unknown as Repository<T>
  }
}
```

- [ ] **Step 2: Selección de driver en el container**

En [src/infrastructure/container.ts](../../../src/infrastructure/container.ts), añadir el import y reemplazar la línea `const uow: UnitOfWork = new JsonUnitOfWork()`:

```ts
import { SqlUnitOfWork } from "./persistence/sql/sql-unit-of-work"
```
```ts
const uow: UnitOfWork =
  process.env.DB_DRIVER === "json" ? new JsonUnitOfWork() : new SqlUnitOfWork()
```

Mantener el import existente de `JsonUnitOfWork`.

- [ ] **Step 3: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/persistence/sql/sql-unit-of-work.ts src/infrastructure/container.ts
git commit -m "feat: wire SqlUnitOfWork with DB_DRIVER flag in container"
```

---

### Task 8: Script de seed JSON → SQL

**Files:**
- Create: `scripts/seed-sql.ts`

**Interfaces:**
- Consumes: tablas de `schema.ts`, `db`/`sql` de `client.ts`, `aggConfigs`/`flatConfigs`/`toRow`.
- Produces: tabla poblada desde `.data/database.json`; imprime conteos.

- [ ] **Step 1: Implementar el seed**

Create `scripts/seed-sql.ts`:

```ts
import "dotenv/config"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { sql, db } from "@/infrastructure/persistence/sql/client"
import { aggConfigs, flatConfigs, toRow } from "@/infrastructure/persistence/sql/table-config"

// Orden de inserción respetando FKs (padres antes que hijos).
const ORDER = [
  "ranchos", "parcelas", "plantillas", "ciclos", "siembras", "semilleros",
  "actividades", "registrosActividad", "productos", "proveedores",
  "movimientosInventario", "requerimientos", "cotizaciones", "ordenesCompra",
  "recepciones", "cuentasPorPagar", "valesSalida",
] as const

async function main() {
  const file = path.join(process.cwd(), ".data", "database.json")
  const data = JSON.parse(await readFile(file, "utf-8")) as Record<string, Record<string, unknown>[]>

  // Vaciar todo (hijas por CASCADE).
  await sql`
    TRUNCATE TABLE
      ranchos, parcelas, plantillas, ciclos, siembras, semilleros,
      actividades, registros_actividad, productos, proveedores,
      movimientos_inventario, requerimientos, detalle_requerimiento,
      cotizaciones, detalle_cotizacion, ordenes_compra, detalle_orden_compra,
      recepciones, detalle_recepcion, cuentas_por_pagar, vales_salida, detalle_vale
    RESTART IDENTITY CASCADE
  `

  let totalLines = 0
  for (const name of ORDER) {
    const rows = data[name] ?? []
    if (rows.length === 0) continue
    const agg = aggConfigs[name]
    if (agg) {
      const parents = rows.map((r) => {
        const { detalles, ...rest } = r as { detalles?: unknown[] }
        void detalles
        return toRow(rest, agg.dateFields)
      })
      await db.insert(agg.table).values(parents as never)
      const children = rows.flatMap((r) =>
        ((r.detalles as Record<string, unknown>[] | undefined) ?? []).map((d) => ({
          ...d,
          [agg.parentFk]: r.id as string,
        })),
      )
      if (children.length > 0) {
        await db.insert(agg.child).values(children as never)
        totalLines += children.length
      }
    } else {
      const cfg = flatConfigs[name]
      const values = rows.map((r) => toRow(r, cfg.dateFields))
      await db.insert(cfg.table).values(values as never)
    }
    console.log(`  ${name}: ${rows.length}`)
  }
  console.log(`  (líneas hijas: ${totalLines})`)
  console.log("OK seed")
  await sql.end()
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Ejecutar el seed**

Run: `pnpm db:seed`
Expected: lista de conteos terminando en `OK seed`. Conteos esperados: ranchos 3, parcelas 7, plantillas 8, ciclos 7, siembras 25, semilleros 4, actividades 8, registrosActividad 73, productos 12, proveedores 5, movimientosInventario 66, requerimientos 17, cotizaciones 17, ordenesCompra 17, recepciones 10, cuentasPorPagar 10, valesSalida 29.

- [ ] **Step 3: Verificar conteos e integridad en la base**

Run:
```bash
pnpm exec tsx -e "import 'dotenv/config'; import postgres from 'postgres'; const sql=postgres(process.env.DATABASE_URL); for (const t of ['ranchos','parcelas','siembras','registros_actividad','vales_salida','detalle_vale']) { const r=await sql.unsafe('select count(*) from '+t); console.log(t, r[0].count) } await sql.end()"
```
Expected: `ranchos 3`, `parcelas 7`, `siembras 25`, `registros_actividad 73`, `vales_salida 29`, `detalle_vale` > 0. Si alguna FK fallara, el seed habría abortado en el Step 2 (valida el modelo relacional).

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-sql.ts
git commit -m "feat: add json->postgres seed script with count verification"
```

---

### Task 9: Verificación end-to-end y paridad de cómputo

**Files:**
- Create: `scripts/check-parity.ts`

**Interfaces:**
- Consumes: servicios de aplicación vía el container (driver seleccionado por `DB_DRIVER`).

- [ ] **Step 1: Probes de rutas con driver SQL**

Asegurar `DB_DRIVER=sql` en `.env`. Levantar dev y probar rutas clave.

Run (en una terminal):
```bash
pnpm dev
```
Run (en otra terminal, tras "Ready"):
```bash
for r in dashboard dashboard/mapa dashboard/kardex dashboard/costeo dashboard/reportes; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$r")
  echo "$r -> $code"
done
```
Expected: cada ruta `-> 200`. Detener `pnpm dev` (Ctrl+C) al terminar (no dejar dev corriendo durante `tsc`/build).

- [ ] **Step 2: Check de paridad JSON vs SQL**

Create `scripts/check-parity.ts`:

El método público real es `InventoryService.existencias(): Promise<ExistenciaProducto[]>` (sin argumentos, calcula saldo PEPS de todos los productos). El script imprime un resumen determinista comparable entre drivers.

```ts
import "dotenv/config"
import { inventoryService, repository } from "@/infrastructure/container"

async function main() {
  const driver = process.env.DB_DRIVER ?? "sql"
  const productos = await repository("productos").findAll()
  const existencias = await inventoryService().existencias()
  // Resumen determinista: total de existencia y valor de inventario.
  const totalExistencia = existencias.reduce((a, e) => a + e.existencia, 0)
  const totalValor = existencias.reduce((a, e) => a + e.valorInventario, 0)
  console.log(JSON.stringify({
    driver,
    productos: productos.length,
    totalExistencia: Number(totalExistencia.toFixed(4)),
    totalValor: Number(totalValor.toFixed(2)),
  }))
}
main().catch((e) => { console.error(e); process.exit(1) })
```

El container lee `DB_DRIVER` al importarse, así que se ejecuta el script una vez por driver (proceso separado) y se compara la salida. En PowerShell usar `$env:DB_DRIVER='json'; pnpm exec tsx scripts/check-parity.ts`.

Run (Bash):
```bash
DB_DRIVER=sql  pnpm exec tsx scripts/check-parity.ts
DB_DRIVER=json pnpm exec tsx scripts/check-parity.ts
```
Expected: ambas líneas con `"productos":12` y **`totalExistencia` y `totalValor` idénticos** entre `sql` y `json`. Coincidencia = paridad de cómputo confirmada.

- [ ] **Step 3: Verificación de tipos final**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-parity.ts
git commit -m "test: add e2e route probes and json/sql compute parity check"
```

---

## Notas de ejecución

- **Orden estricto:** Task 1 → 9. La Task 1 deja todo verde antes de tocar SQL; las Tasks 3–8 dependen en cadena.
- **Datos existentes:** `.data/database.json` es la fuente del seed. No se borra; el driver JSON sigue disponible con `DB_DRIVER=json`.
- **Rollback:** poner `DB_DRIVER=json` en `.env` revierte a persistencia de archivo sin tocar código.
- **Limpieza opcional (fuera de alcance):** una vez validado SQL en producción, se puede borrar el adaptador JSON y `.data/`; no forma parte de este plan.

## Self-Review (autor del plan)

- **Cobertura del spec:** §2 inventario → Task 3 (todas las tablas). §3 esquema/enums/fechas/jsonb → Task 3 + mappers Task 4. §4 findWhere→findBy → Task 1. §5 capa repositorio (client, schema, mappers, genérico, agregado, uow, container) → Tasks 2–7. §6 tooling/docker/seed/scripts → Tasks 2 y 8. §7 deps → Task 2. §8 verificación (tsc, generate/migrate, seed counts, integridad FK, probes, paridad) → Tasks 3,8,9. §9 fuera de alcance → notas. Sin huecos.
- **Placeholders:** ninguno. Los 6 callers de `findWhere` (T1) y el método de paridad `existencias()` (T9) están fijados con sus nombres/líneas reales leídos del repo.
- **Consistencia de tipos:** `findBy(criteria: Partial<T>)` idéntico en puerto (T1), `DrizzleRepository` (T5), `AggregateRepository` (T6). `toEntity`/`toRow`/`flatConfigs`/`aggConfigs`/`parentFk` consistentes entre T4, T5, T6, T8. Nombres de tabla snake_case del TRUNCATE (T8) coinciden con `pgTable(...)` de T3.
```
