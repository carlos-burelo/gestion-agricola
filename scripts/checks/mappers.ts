import assert from "node:assert/strict"
import { toEntity, toRow } from "@/infrastructure/persistence/sql/table-config"

const iso = "2025-01-10T08:00:00.000Z"
const row = {
  id: "x",
  createdAt: new Date(iso),
  updatedAt: new Date(iso),
  nombre: "A",
}
const entity = toEntity<{ createdAt: string }>(row, ["createdAt", "updatedAt"])
assert.equal(entity.createdAt, iso, "Date debe volverse ISO string")

const back = toRow({ createdAt: iso, nombre: "A" }, ["createdAt"])
assert.ok(back.createdAt instanceof Date, "ISO string debe volverse Date")
assert.equal(
  (back.createdAt as Date).toISOString(),
  iso,
  "round-trip exacto",
)
console.log("OK mappers")
