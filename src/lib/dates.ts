/**
 * Single source of truth for date parsing and formatting across the app.
 *
 * All formatting is deterministic and UTC-based (no locale/timezone lookups),
 * so server and client render identically — avoiding hydration mismatches and
 * the off-by-one-day shifts that `toLocaleDateString` causes on date-only
 * values.
 */

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
]
const MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

export type DateVariant = "short" | "long"

/** Parses an ISO string / Date / timestamp into a Date, or null if invalid. */
function parse(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Formats a date value.
 * - `short` → `20 ene 25`
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
  const day = String(d.getUTCDate()).padStart(2, "0")
  const month = d.getUTCMonth()
  const year = d.getUTCFullYear()
  return variant === "long"
    ? `${day} de ${MONTHS_LONG[month]} de ${year}`
    : `${day} ${MONTHS_SHORT[month]} ${String(year).slice(2)}`
}

/** Convenience wrappers. */
export const formatDateShort = (v: string | number | Date | null | undefined) =>
  formatDate(v, "short")
export const formatDateLong = (v: string | number | Date | null | undefined) =>
  formatDate(v, "long")

/** `YYYY-MM-DD` value for <input type="date"> and persistence. Defaults to today. */
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
