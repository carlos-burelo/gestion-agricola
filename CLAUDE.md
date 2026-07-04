# Project conventions

Agricultural management system (pineapple production). Next.js 16 + TypeScript,
hexagonal architecture (core/domain → core/application → infrastructure →
presentation). Package manager: **pnpm**.

## Dates — ALWAYS go through `src/lib/dates.ts`

**Every date that is displayed, parsed, or written MUST pass through the central
date module at [`src/lib/dates.ts`](src/lib/dates.ts).** Do not call
`new Date().toISOString().slice(...)`, `toLocaleDateString`, ad-hoc month arrays,
or render a raw ISO/`fecha` string in JSX. This keeps every date consistent and
avoids locale/timezone hydration mismatches (the module is deterministic & UTC).

Use:

- `formatDate(value, "short")` → `20 ene 25` — tables, compact cells (default).
- `formatDate(value, "long")` → `20 de enero de 2025` — detail/headers.
- `formatDateShort` / `formatDateLong` — convenience wrappers.
- `toDateInput(value?)` → `YYYY-MM-DD` — `<input type="date">` defaults and
  persistence; defaults to today when called with no argument.
- `monthKey(value)` → `YYYY-MM` — monthly grouping keys.

Empty/invalid input returns `"—"` from the formatters, so render the result
directly. When you add a new date display or input, import from `@/lib/dates`
instead of formatting inline.

## Persistence

PostgreSQL via Drizzle (`src/infrastructure/persistence/sql/`). Repository
ports in `src/core/domain`. See the project memory for dev setup (docker port
5433, etc.).

## Verification

No ESLint/unit-test runner wired. Verify with `pnpm exec tsc --noEmit` (or
`./node_modules/.bin/tsc --noEmit` if the pnpm wrapper misbehaves) plus route
probes against `next dev`. Don't run `next build` while `next dev` is running.

Playwright E2E lives in `e2e/` (`pnpm test:e2e`). `playwright.config.ts`
reuses whatever `next dev` is already running on port 3000
(`reuseExistingServer: true`) instead of spawning a second instance.
