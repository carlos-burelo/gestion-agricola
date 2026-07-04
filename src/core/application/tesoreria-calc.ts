import { monthKey } from "@/lib/dates"
import type { Categoria, DireccionMovimiento, Movimiento, TipoCategoria } from "@/core/domain/entities"

/**
 * saldo = saldoInicial + Σ(entradas) - Σ(salidas). No se trunca en 0: un
 * saldo negativo es información real (sobregiro), no un error de cálculo.
 */
export function calcularSaldo(
  saldoInicial: number,
  movimientos: { direccion: DireccionMovimiento; monto: number }[],
): number {
  return movimientos.reduce(
    (saldo, m) => saldo + (m.direccion === "entrada" ? m.monto : -m.monto),
    saldoInicial,
  )
}

export interface FilaMatriz {
  categoriaId: string
  nombre: string
  tipo: TipoCategoria
  nivel: number
  porCuenta: Record<string, number>
  total: number
}

export interface MatrizMensual {
  filas: FilaMatriz[]
  totalesPorCuenta: Record<string, number>
  totalGeneral: number
}

const direccionEsperada: Record<TipoCategoria, "entrada" | "salida"> = {
  ingreso: "entrada",
  egreso: "salida",
}

/**
 * Replica el Excel: cada categoría hoja se llena con SUMIFS (movimientos
 * que matchean esa categoría y su dirección esperada); cada categoría
 * padre es SUM() de sus hijas directas (p.ej. ENE25!C21 = SUM(C22:C28)
 * para PRODUCCION). No hay doble-conteo porque un movimiento solo se
 * asocia a una hoja.
 */
export function calcularMatrizMensual(
  categorias: Categoria[],
  movimientos: Movimiento[],
  mes: number,
  anio: number,
): MatrizMensual {
  const claveMes = `${anio}-${String(mes).padStart(2, "0")}`
  const delMes = movimientos.filter((m) => monthKey(m.fecha) === claveMes)

  const hijosPorPadre = new Map<string, Categoria[]>()
  for (const c of categorias) {
    const lista = hijosPorPadre.get(c.parentId) ?? []
    lista.push(c)
    hijosPorPadre.set(c.parentId, lista)
  }
  const esHoja = (c: Categoria) => !hijosPorPadre.has(c.id)

  const porCuentaDe = (categoriaId: string, tipo: TipoCategoria): Record<string, number> => {
    const totales: Record<string, number> = {}
    for (const m of delMes) {
      if (m.categoriaId !== categoriaId) continue
      if (m.direccion !== direccionEsperada[tipo]) continue
      totales[m.cuentaId] = (totales[m.cuentaId] ?? 0) + m.monto
    }
    return totales
  }

  const sumarPorCuenta = (a: Record<string, number>, b: Record<string, number>) => {
    const out = { ...a }
    for (const [cuentaId, monto] of Object.entries(b)) {
      out[cuentaId] = (out[cuentaId] ?? 0) + monto
    }
    return out
  }

  const filaDe = (c: Categoria, nivel: number): FilaMatriz => {
    const porCuenta = esHoja(c)
      ? porCuentaDe(c.id, c.tipo)
      : (hijosPorPadre.get(c.id) ?? [])
          .map((hijo) => filaDe(hijo, nivel + 1).porCuenta)
          .reduce(sumarPorCuenta, {})
    const total = Object.values(porCuenta).reduce((a, b) => a + b, 0)
    return { categoriaId: c.id, nombre: c.nombre, tipo: c.tipo, nivel, porCuenta, total }
  }

  const raices = categorias
    .filter((c) => c.parentId === "")
    .sort((a, b) => a.orden - b.orden)

  const filas: FilaMatriz[] = []
  const aplanar = (c: Categoria, nivel: number) => {
    const fila = filaDe(c, nivel)
    filas.push(fila)
    for (const hijo of (hijosPorPadre.get(c.id) ?? []).sort((a, b) => a.orden - b.orden)) {
      aplanar(hijo, nivel + 1)
    }
  }
  for (const raiz of raices) aplanar(raiz, 0)

  const totalesPorCuenta = filas
    .filter((f) => f.nivel === 0)
    .map((f) => f.porCuenta)
    .reduce(sumarPorCuenta, {})
  const totalGeneral = Object.values(totalesPorCuenta).reduce((a, b) => a + b, 0)

  return { filas, totalesPorCuenta, totalGeneral }
}
