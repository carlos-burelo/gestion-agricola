import { redirect } from "next/navigation"
import { PageHeader } from "@/presentation/components/page-header"
import { toDateInput } from "@/lib/dates"
import { getCurrentUser } from "@/infrastructure/auth/current-user"
import { repository } from "@/infrastructure/container"
import type { Cuenta } from "@/core/domain/entities"
import { registrarTraspaso } from "./actions"

export default async function TraspasosPage() {
  const actor = await getCurrentUser()
  if (!actor) redirect("/login")
  if (actor.rol !== "admin") redirect("/dashboard/tesoreria")

  const cuentas = await repository<Cuenta>("cuentas").findAll()

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
