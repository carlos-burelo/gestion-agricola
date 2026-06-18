import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import seed from "./seed.json"

/**
 * Low-level JSON datastore. It owns a single JSON document on disk that mirrors
 * the database schema (one top-level key per collection). On first access it
 * copies the bundled seed into a writable file so the original seed is never
 * mutated.
 *
 * This class is the ONLY place in the codebase that touches the filesystem.
 * Swapping it for a SQL connection pool is the entire "migration": the
 * repository contract above it never changes.
 *
 * Access is serialized through a write queue to avoid lost updates when
 * concurrent Server Actions mutate the same file.
 */

type RawDatabase = Record<string, unknown[]>

const DATA_DIR = path.join(process.cwd(), ".data")
const DATA_FILE = path.join(DATA_DIR, "database.json")

let cache: RawDatabase | null = null
let writeChain: Promise<void> = Promise.resolve()

async function ensureFile(): Promise<RawDatabase> {
  if (cache) return cache
  try {
    const contents = await fs.readFile(DATA_FILE, "utf-8")
    cache = JSON.parse(contents) as RawDatabase
  } catch {
    // First run (or missing file): hydrate from the bundled seed.
    cache = structuredClone(seed) as RawDatabase
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8")
  }
  return cache
}

async function persist(db: RawDatabase): Promise<void> {
  cache = db
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf-8")
}

export const jsonDatastore = {
  /** Returns a deep copy of a collection so callers cannot mutate the cache. */
  async read<T>(collection: string): Promise<T[]> {
    const db = await ensureFile()
    const rows = (db[collection] as T[] | undefined) ?? []
    return structuredClone(rows)
  },

  /**
   * Serialized read-modify-write transaction over a single collection. The
   * mutator receives the live rows, returns the next rows plus a result value.
   */
  async mutate<T, R>(
    collection: string,
    mutator: (rows: T[]) => { rows: T[]; result: R },
  ): Promise<R> {
    const run = async (): Promise<R> => {
      const db = await ensureFile()
      const current = (db[collection] as T[] | undefined) ?? []
      const { rows, result } = mutator(structuredClone(current))
      await persist({ ...db, [collection]: rows as unknown[] })
      return result
    }
    const pending = writeChain.then(run, run)
    writeChain = pending.then(
      () => undefined,
      () => undefined,
    )
    return pending
  },

  /** Resets the datastore back to the bundled seed. Useful for demos/tests. */
  async reset(): Promise<void> {
    const fresh = structuredClone(seed) as RawDatabase
    await persist(fresh)
  },
}
