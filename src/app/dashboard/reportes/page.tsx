import { Boxes, Coins, Package } from "lucide-react"
import {
  Card,
  CardContent,
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
import type { Producto } from "@/core/domain/entities"
import { inventoryService, repository } from "@/infrastructure/container"
import { ChartCard } from "@/presentation/components/chart-card"
import { BarTopProductos } from "@/presentation/components/charts/bar-top-productos"
import { PageHeader } from "@/presentation/components/page-header"
import { StatCard } from "@/presentation/components/stat-card"

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)

export default async function ReportesPage() {
  const [existencias, productos] = await Promise.all([
    inventoryService().existencias(),
    repository<Producto>("productos").findAll(),
  ])

  const productoLabel = (id: string) => {
    const p = productos.find((x) => x.id === id)
    return p ? `${p.nombreComercial} (${p.unidadMedida})` : id
  }

  const valorTotal = existencias.reduce((acc, e) => acc + e.valorInventario, 0)
  const unidadesTotal = existencias.reduce((acc, e) => acc + e.existencia, 0)

  const topProductos = [...existencias]
    .sort((a, b) => b.valorInventario - a.valorInventario)
    .slice(0, 8)
    .map((e) => ({
      nombre: e.producto.nombreComercial,
      valor: Math.round(e.valorInventario),
    }))

  const iconCls = "size-4 text-primary"

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reportes"
        description="Indicadores consolidados de inventario valorizado."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Valor total en almacén"
          value={currency(valorTotal)}
          icon={<Coins className={iconCls} />}
        />
        <StatCard
          label="Productos en catálogo"
          value={productos.length.toLocaleString("es-MX")}
          icon={<Package className={iconCls} />}
        />
        <StatCard
          label="Unidades en existencia"
          value={unidadesTotal.toLocaleString("es-MX")}
          icon={<Boxes className={iconCls} />}
        />
      </section>

      <ChartCard
        title="Top productos por valor"
        description="Valor de inventario (PEPS)"
      >
        <BarTopProductos data={topProductos} />
      </ChartCard>

      <Card>
        <CardHeader>
          <CardTitle>Inventario valorizado (PEPS)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Existencia</TableHead>
                  <TableHead className="text-right">Costo promedio</TableHead>
                  <TableHead className="text-right">Valor inventario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existencias.map((e) => (
                  <TableRow key={e.producto.id}>
                    <TableCell className="font-medium">
                      {productoLabel(e.producto.id)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.existencia}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {currency(e.costoPromedio)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {currency(e.valorInventario)}
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
