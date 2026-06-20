# Diseño: Migración de persistencia JSON → PostgreSQL (Drizzle)

- **Fecha:** 2026-06-19
- **Estado:** Aprobado para implementación
- **Alcance:** Reemplazar el adaptador de persistencia JSON por un adaptador
  PostgreSQL usando Drizzle ORM, sin tocar las capas de dominio, aplicación ni
  presentación más allá de un cambio de contrato puntual (`findWhere` → `findBy`).

## 1. Contexto y motivación

El sistema usa una arquitectura hexagonal limpia. La persistencia está aislada
detrás de los puertos `Repository<T>` y `UnitOfWork`
([src/core/domain/repositories.ts](../../../src/core/domain/repositories.ts)).
Hoy el único adaptador es un datastore de archivo JSON
([src/infrastructure/persistence/json-datastore.ts](../../../src/infrastructure/persistence/json-datastore.ts))
y el composition root
([src/infrastructure/container.ts](../../../src/infrastructure/container.ts))
documenta explícitamente que migrar a SQL es "swap `JsonUnitOfWork` for
`SqlUnitOfWork`".

La migración aprovecha ese seam: se añade un adaptador SQL que implementa los
mismos puertos. El dominio, los servicios de aplicación y la presentación
permanecen iguales, salvo el reemplazo de `findWhere(predicate)` por
`findBy(criteria)` (ver §4), necesario porque un predicado de JavaScript no se
puede traducir a una cláusula `WHERE`.

### Decisiones tomadas (brainstorming)

| Decisión | Elección |
|---|---|
| ORM / driver | **Drizzle ORM** sobre `postgres` (postgres.js) |
| Hosting | **PostgreSQL local en Docker** (postgres:17) |
| Arrays `detalles[]` | **Tablas hijas normalizadas** (no jsonb) |
| `geometria` | **`jsonb`** (sin queries espaciales hoy; migrable a PostGIS después) |
| IDs | **Conservar `text`** existentes (`rancho-1`, etc.) |
| `findWhere` | **Reemplazar por `findBy(Partial<T>)`** |
| Adaptador JSON | **Conservar** detrás de flag de entorno `DB_DRIVER` (rollback/tests) |

## 2. Inventario del modelo de datos actual

17 colecciones (~390 registros). Fuente de verdad de tipos:
[src/core/domain/entities.ts](../../../src/core/domain/entities.ts).

**Tablas planas (12)** — la entidad mapea 1:1 a una fila:
`ranchos`, `parcelas`, `plantillas`, `ciclos`, `siembras`, `semilleros`,
`actividades`, `registrosActividad`, `productos`, `proveedores`,
`movimientosInventario`, `cuentasPorPagar`.

**Agregados con líneas (5)** — un padre + una tabla hija:

| Padre | Tabla hija | Campos de la línea |
|---|---|---|
| `requerimientos` | `detalle_requerimiento` | productoId, cantidad, unidadMedida |
| `cotizaciones` | `detalle_cotizacion` | productoId, cantidad, precioUnitario |
| `ordenesCompra` | `detalle_orden_compra` | productoId, cantidad, precioUnitario |
| `recepciones` | `detalle_recepcion` | productoId, cantidad, costoUnitario |
| `valesSalida` | `detalle_vale` | productoId, cantidad, costoUnitario |

**Relaciones (FKs implícitas por `*Id`, a formalizar):**

```
ranchos ──< parcelas ──< plantillas
parcelas ──< ciclos ──< siembras >── plantillas
parcelas ──< semilleros
actividades ──< registrosActividad >── (ranchos, parcelas, plantillas, ciclos)
proveedores ──< movimientosInventario >── productos
proveedores ──< cuentasPorPagar
requerimientos ──< detalle_requerimiento >── productos
cotizaciones >── (requerimientos, proveedores) ──< detalle_cotizacion >── productos
ordenes_compra >── proveedores ──< detalle_orden_compra >── productos
recepciones >── ordenes_compra ──< detalle_recepcion >── productos
vales_salida >── (ranchos, parcelas, plantillas, ciclos) ──< detalle_vale >── productos
```

**Conteos esperados (para validar el seed):**
ranchos 3 · parcelas 7 · plantillas 8 · ciclos 7 · siembras 25 · semilleros 4 ·
actividades 8 · registrosActividad 73 · productos 12 · proveedores 5 ·
movimientosInventario 66 · requerimientos 17 · cotizaciones 17 ·
ordenesCompra 17 · recepciones 10 · cuentasPorPagar 10 · valesSalida 29.

## 3. Esquema SQL (Drizzle)

### Convenciones
- **PK** de tablas raíz: `text`, conservando los ids actuales. El generador de
  ids existente (`<collection>-<timestamp>-<rand>`) se mantiene en el repo.
- **PK** de tablas hijas: surrogate `serial` (las líneas no tienen id propio en
  el JSON). FK al padre con `ON DELETE CASCADE`; FK a `productos`.
- **Nombres:** columnas en `snake_case` en la base; Drizzle las mapea a las
  propiedades `camelCase` que esperan las entidades. **El shape de cada entidad
  TypeScript no cambia.**
- **Auditoría:** `created_at`, `updated_at` como `timestamptz NOT NULL`.

### Enums (`pgEnum`)
- `estado_activo`: `activo | inactivo`
- `estado_ciclo`: `planeado | activo | cosechado | cerrado`
- `estado_cotizacion`: `pendiente | cotizada | comprada`
- `estado_orden_compra`: `borrador | autorizada | parcial | surtida | cancelada`
- `estado_cuenta_por_pagar`: `pendiente | pagada | vencida`
- `tipo_movimiento`: `entrada | salida`

### Fechas
Todos los campos de fecha (`createdAt`, `updatedAt`, `fecha`, `fechaInicio`,
`fechaCosechaEstimada`, `fechaProduccion`, `fechaVencimiento`) se almacenan como
`timestamptz`. La capa de mapeo (`row-mappers.ts`) convierte `Date → ISO string`
en lectura y `string → Date` en escritura, de modo que el contrato `string` del
dominio se preserva exactamente.

### geometria
Columna `geometria jsonb` nullable en `parcelas`; guarda el GeoJSON Polygon tal
cual. El mapa lo consume directo. Migración futura a `geometry(Polygon,4326)`
queda fuera de alcance.

## 4. Cambio de contrato: `findWhere` → `findBy`

`Repository<T>.findWhere(predicate: (entity: T) => boolean)` no es traducible a
SQL. Los 6 usos actuales son todos igualdad de un solo campo:

- inventory-service: `m.productoId === productoId` (×2)
- traceability-service: `c.requerimientoId === …`, `o.proveedorId === …`,
  `r.ordenCompraId === …`, `c.factura === …`

Se reemplaza el puerto por:

```ts
findBy(criteria: Partial<T>): Promise<T[]>   // AND de igualdades → WHERE real
```

**Cambios:**
- [src/core/domain/repositories.ts](../../../src/core/domain/repositories.ts): firma del puerto.
- Adaptador JSON ([json-repository.ts](../../../src/infrastructure/persistence/json-repository.ts)):
  `findBy` filtra por igualdad de las claves dadas.
- 6 callers en `inventory-service.ts` y `traceability-service.ts`:
  `findWhere((x) => x.f === v)` → `findBy({ f: v })`.
- La capa de presentación **no** cambia (no usa `findWhere`).

## 5. Capa de repositorio SQL (nuevo adaptador)

Todo bajo `src/infrastructure/persistence/sql/`:

| Archivo | Responsabilidad |
|---|---|
| `client.ts` | Crea la conexión `postgres(DATABASE_URL)` y la instancia `drizzle`. Singleton. |
| `schema.ts` | Definición de tablas, enums y `relations` de Drizzle. |
| `row-mappers.ts` | Por tabla: `rowToEntity` / `entityToRow` (conversión de fechas, geometria, snake↔camel donde Drizzle no baste). |
| `drizzle-repository.ts` | `DrizzleRepository<T>` genérico para las 12 tablas planas; implementa `Repository<T>`. |
| `aggregate-repository.ts` | 5 repos para los agregados con `detalles[]`. Implementan `Repository<T>`: en lectura hidratan las líneas con un query a la tabla hija; en escritura insertan/actualizan padre + hijos en una **transacción** Drizzle. |
| `sql-unit-of-work.ts` | `SqlUnitOfWork implements UnitOfWork`. Devuelve el repo genérico o el agregado según el nombre de colección. |

**Mapa colección → repo** (en `sql-unit-of-work.ts`): las 5 colecciones con
líneas (`requerimientos`, `cotizaciones`, `ordenesCompra`, `recepciones`,
`valesSalida`) se sirven con su repo agregado; las otras 12 con
`DrizzleRepository<T>`.

### Composition root
[src/infrastructure/container.ts](../../../src/infrastructure/container.ts)
selecciona el `UnitOfWork` por flag de entorno:

```ts
const uow: UnitOfWork =
  process.env.DB_DRIVER === "json" ? new JsonUnitOfWork() : new SqlUnitOfWork()
```

Default = SQL. `DB_DRIVER=json` conserva el comportamiento anterior (rollback,
tests sin base). Es el **único** cambio en `container.ts`.

## 6. Migración de datos y tooling

- **`docker-compose.yml`**: servicio `postgres:17`, volumen persistente, puerto
  5432, credenciales de dev. `.env` con `DATABASE_URL` y `DB_DRIVER`.
- **`drizzle.config.ts`**: apunta a `schema.ts` y `DATABASE_URL`; salida de
  migraciones en `drizzle/`.
- **`scripts/seed-sql.ts`** (ejecutado con `tsx`): lee `.data/database.json`,
  inserta en orden de dependencia, separando `detalles[]` en sus tablas hijas.
  Idempotente: `TRUNCATE … RESTART IDENTITY CASCADE` y reinserta. Verifica
  conteos al final.
- **Scripts en `package.json`:**
  - `db:up` → `docker compose up -d`
  - `db:generate` → `drizzle-kit generate`
  - `db:migrate` → `drizzle-kit migrate`
  - `db:seed` → `tsx scripts/seed-sql.ts`
  - `db:reset` → `db:migrate` + `db:seed`

## 7. Dependencias

- **prod:** `drizzle-orm`, `postgres`
- **dev:** `drizzle-kit`, `tsx`, `dotenv`

Instalar con **pnpm** (gestor del proyecto).

## 8. Estrategia de pruebas / verificación

Sin ESLint ni build mientras `next dev` esté activo (ver memoria de verificación).

1. **Tipos:** `pnpm tsc --noEmit` limpio (incluye `schema.ts` y scripts).
2. **Esquema:** `db:generate` produce SQL sin errores; `db:migrate` aplica.
3. **Seed:** `db:seed` corre y los conteos por colección coinciden con §2.
   Las 5 tablas hijas suman el total de líneas del JSON.
4. **Integridad:** todas las FKs resuelven (el seed falla si alguna `*Id`
   apunta a un registro inexistente → valida el modelo).
5. **Rutas:** probe a rutas clave del dashboard (`/dashboard/mapa`,
   `/dashboard/kardex`, `/dashboard/costeo`, `/dashboard/reportes`) → 200 con
   datos renderizados.
6. **Paridad de cómputo:** comparar 1-2 reportes calculados (aging,
   estado-cuenta) entre `DB_DRIVER=json` y SQL: resultados idénticos.

## 9. Fuera de alcance

- PostGIS / queries espaciales.
- Migración de IDs a UUID/serial.
- Autenticación, multi-tenancy, pooling avanzado.
- Eliminar el adaptador JSON (se conserva tras el flag).
```
