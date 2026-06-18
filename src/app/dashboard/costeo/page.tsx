import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  NivelCosteo,
  ResumenCosto,
} from "@/core/application/costing-service"
import { costingService } from "@/infrastructure/container"
import { BarCosteoNivel } from "@/presentation/components/charts/bar-costeo-nivel"
import { PageHeader } from "@/presentation/components/page-header"
import { loadLabelMap } from "@/presentation/queries"
import { getModuleBySlug } from "@/presentation/config/modules"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)

const NIVELES: { key: NivelCosteo; title: string; slug: string }[] = [
  { key: "ranchoId", title: "Por rancho", slug: "ranchos" },
  { key: "parcelaId", title: "Por parcela", slug: "parcelas" },
  { key: "plantillaId", title: "Por plantilla", slug: "plantillas" },
  { key: "cicloId", title: "Por ciclo", slug: "ciclos" },
]

function CostoTable({
  rows,
  labels,
}: {
  rows: ResumenCosto[]
  labels: Record<string, string>
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead className="text-right">Mano de obra</TableHead>
            <TableHead className="text-right">Insumos</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                Sin datos.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.clave}>
                <TableCell className="font-medium">
                  {labels[r.clave] ?? r.clave}
                </TableCell>
                <TableCell className="text-right">{currency(r.manoObra)}</TableCell>
                <TableCell className="text-right">{currency(r.insumos)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {currency(r.total)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function CosteoPage() {
  const service = costingService()
  const [resumenes, costosSemilla, ranchoLabels, parcelaLabels, plantillaLabels] =
    await Promise.all([
      Promise.all(NIVELES.map((n) => service.resumenPorNivel(n.key))),
      service.costoSemilla(),
      loadLabelMap(getModuleBySlug("parcelas")!),
      loadLabelMap(getModuleBySlug("plantillas")!),
      loadLabelMap(getModuleBySlug("ciclos")!),
    ])

  // Combine all label maps so each level can resolve its keys.
  const labels = { ...ranchoLabels, ...parcelaLabels, ...plantillaLabels }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Costeo agrícola"
        description="Acumulación de costos de mano de obra e insumos por nivel productivo."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {NIVELES.map((nivel, i) => (
          <Card key={nivel.key}>
            <CardHeader>
              <CardTitle className="text-base">{nivel.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <BarCosteoNivel rows={resumenes[i]} labels={labels} />
              <CostoTable rows={resumenes[i]} labels={labels} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Costo de planta de semillero</CardTitle>
          <CardDescription>
            Costo unitario por planta producida en cada semillero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semillero</TableHead>
                  <TableHead className="text-right">Costo total</TableHead>
                  <TableHead className="text-right">Plantas</TableHead>
                  <TableHead className="text-right">Costo unitario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costosSemilla.map((c) => (
                  <TableRow key={c.semilleroId}>
                    <TableCell className="font-medium">{c.semilleroId}</TableCell>
                    <TableCell className="text-right">
                      {currency(c.costoTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.plantasProducidas.toLocaleString("es-MX")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {currency(c.costoUnitario)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
