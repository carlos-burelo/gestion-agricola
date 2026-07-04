import { test, expect } from "@playwright/test"
import { TesoreriaFixtures } from "./helpers/fixtures"
import { selectShadcn } from "./helpers/ui"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@tesoreria.local"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave-123"

test.describe("Traspasos — atómico, 1 acción crea 2 movimientos ligados", () => {
  let fx: TesoreriaFixtures
  let origenId: string
  let destinoId: string

  test.beforeAll(async () => {
    fx = new TesoreriaFixtures()
    origenId = await fx.crearCuenta("Traspaso Origen", 1000)
    destinoId = await fx.crearCuenta("Traspaso Destino", 0)
  })
  test.afterAll(async () => {
    await fx.teardown()
  })

  test("registrar un traspaso mueve el dinero de una cuenta a otra sin duplicar captura", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Correo").fill(ADMIN_EMAIL)
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD)
    await page.getByRole("button", { name: /entrar/i }).click()
    await page.waitForURL("**/dashboard/tesoreria")

    await page.goto("/dashboard/tesoreria/traspasos")
    await selectShadcn(page, "Cuenta origen", "E2E Traspaso Origen")
    await selectShadcn(page, "Cuenta destino", "E2E Traspaso Destino")
    await page.locator('input[name="monto"]').fill("300")
    await page.locator('input[name="referencia"]').fill("e2e-test")
    await page.getByRole("button", { name: /registrar traspaso/i }).click()
    await page.waitForLoadState("networkidle")

    // Confirma primero en la UI (navegar al ledger del destino fuerza una
    // lectura fresca del servidor) antes de leer la base directo — el POST
    // de la Server Action puede resolver la respuesta un instante antes de
    // que la escritura quede completamente asentada bajo Turbopack en dev.
    await page.goto(`/dashboard/tesoreria/${destinoId}`)
    const filaTraspaso = page.locator("tbody tr", { hasText: "Traspaso" })
    await expect(filaTraspaso).toBeVisible()
    await expect(filaTraspaso).toContainText(
      (300).toLocaleString("es-MX", { style: "currency", currency: "MXN" }),
    )

    // Un solo movimiento de captura → ambas cuentas reflejan el cambio.
    const saldoOrigen = await fx.saldoDeCuentaId(origenId)
    const saldoDestino = await fx.saldoDeCuentaId(destinoId)
    expect(saldoOrigen).toBe(700) // 1000 - 300
    expect(saldoDestino).toBe(300) // 0 + 300
  })
})
