/**
 * Single source of truth for date parsing and formatting across the app.
 *
 * Uses `Intl.DateTimeFormat` with `timeZone: "UTC"` so formatting is
 * deterministic regardless of the server/client timezone — avoiding
 * hydration mismatches and the off-by-one-day shifts that
 * `toLocaleDateString` causes on date-only values.
 */

const LOCALE = "es-MX"

// ─── Cached formatters (created once, reused on every call) ────────────────

/** `20 ene. 25` */
const fmtShort = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
})

/** `20 de enero de 2025` */
const fmtLong = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

// ─── Parser ────────────────────────────────────────────────────────────────

/** Parses an ISO string / Date / timestamp into a Date, or null if invalid. */
function parse(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// ─── Public API ────────────────────────────────────────────────────────────

export type DateVariant = "short" | "long"

/**
 * Formats a date value using the `es-MX` locale.
 * - `short` → `20 ene. 25`
 * - `long`  → `20 de enero de 2025`
 *
 * Empty/invalid input returns "—" so callers can render it directly.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  variant: DateVariant = "short",
): string {
  const d = parse(value)
  if (!d) return "—"
  return variant === "long" ? fmtLong.format(d) : fmtShort.format(d)
}

/** Convenience wrappers. */
export const formatDateShort = (v: string | number | Date | null | undefined) =>
  formatDate(v, "short")
export const formatDateLong = (v: string | number | Date | null | undefined) =>
  formatDate(v, "long")

/** `YYYY-MM-DD` value for `<input type="date">` and persistence. Defaults to today. */
export function toDateInput(
  value: string | number | Date | null | undefined = new Date(),
): string {
  const d = parse(value) ?? new Date()
  return d.toISOString().slice(0, 10)
}

/** `YYYY-MM` key for monthly grouping. */
export function monthKey(
  value: string | number | Date | null | undefined,
): string {
  const d = parse(value)
  return d ? d.toISOString().slice(0, 7) : "0000-00"
}
