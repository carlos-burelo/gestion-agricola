import type { Categoria, Cuenta, Movimiento } from "@/core/domain/entities"
import { NotFoundError } from "@/core/domain/errors"
import type { Repository } from "@/core/domain/repositories"
import { calcularMatrizMensual, calcularSaldo, type MatrizMensual } from "./tesoreria-calc"

export class TesoreriaService {
  constructor(
    private readonly cuentas: Repository<Cuenta>,
    private readonly categorias: Repository<Categoria>,
    private readonly movimientos: Repository<Movimiento>,
  ) {}

  async saldoDeCuenta(cuentaId: string): Promise<number> {
    const cuenta = await this.cuentas.findById(cuentaId)
    if (!cuenta) throw new NotFoundError("cuentas", cuentaId)
    const movs = await this.movimientos.findBy({ cuentaId } as Partial<Movimiento>)
    return calcularSaldo(cuenta.saldoInicial, movs)
  }

  async saldosDeTodasLasCuentas(): Promise<Record<string, number>> {
    const [cuentas, movimientos] = await Promise.all([
      this.cuentas.findAll(),
      this.movimientos.findAll(),
    ])
    const porCuenta = new Map<string, Movimiento[]>()
    for (const m of movimientos) {
      const lista = porCuenta.get(m.cuentaId) ?? []
      lista.push(m)
      porCuenta.set(m.cuentaId, lista)
    }
    const out: Record<string, number> = {}
    for (const cuenta of cuentas) {
      out[cuenta.id] = calcularSaldo(cuenta.saldoInicial, porCuenta.get(cuenta.id) ?? [])
    }
    return out
  }

  async reporteMensual(mes: number, anio: number): Promise<MatrizMensual> {
    const [categorias, movimientos] = await Promise.all([
      this.categorias.findAll(),
      this.movimientos.findAll(),
    ])
    return calcularMatrizMensual(categorias, movimientos, mes, anio)
  }
}
