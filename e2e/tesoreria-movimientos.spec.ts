import { test, expect } from "@playwright/test"
import { TesoreriaFixtures } from "./helpers/fixtures"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@tesoreria.local"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave-123"

test.describe("Captura de movimientos — validación de categoría/dirección", () => {
  let fx: TesoreriaFixtures
  let cuentaId: string
  let categoriaIngresoId: string

  test.beforeAll(async () => {
    fx = new TesoreriaFixtures()
    cuentaId = await fx.crearCuenta("Movimientos", 1000)
    categoriaIngresoId = await fx.categoriaHoja("VENTA GANADO", "ingreso")
  })
  test.afterAll(async () => {
    await fx.teardown()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Correo").fill(ADMIN_EMAIL)
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD)
    await page.getByRole("button", { name: /entrar/i }).click()
    await page.waitForURL("**/dashboard/tesoreria")
  })

  test("capturar una entrada con categoría de ingreso correcta actualiza el saldo", async ({ page }) => {
    await page.goto(`/dashboard/tesoreria/${cuentaId}`)
    await page.locator('select[name="direccion"]').selectOption("entrada")
    await page.locator('select[name="categoriaId"]').selectOption(categoriaIngresoId)
    await page.locator('input[name="monto"]').fill("250")
    await page.locator('input[name="beneficiario"]').fill("E2E test")
    await page.getByRole("button", { name: /guardar/i }).click()
    await page.waitForLoadState("networkidle")

    const saldo = await fx.saldoDeCuentaId(cuentaId)
    expect(saldo).toBe(1250) // 1000 + 250

    await expect(page.getByText((1250).toLocaleString("es-MX", { style: "currency", currency: "MXN" }))).toBeVisible()
  })

  test("capturar una salida con una categoría de tipo ingreso se rechaza (no se crea el movimiento)", async ({ page }) => {
    const saldoAntes = await fx.saldoDeCuentaId(cuentaId)

    await page.goto(`/dashboard/tesoreria/${cuentaId}`)
    // Selecciona SALIDA pero deja una categoría de tipo ingreso — el <select>
    // no filtra por dirección, así que esta combinación inválida es
    // alcanzable desde el formulario normal, no solo con una petición forjada.
    await page.locator('select[name="direccion"]').selectOption("salida")
    await page.locator('select[name="categoriaId"]').selectOption(categoriaIngresoId)
    await page.locator('input[name="monto"]').fill("999999")
    await page.getByRole("button", { name: /guardar/i }).click()
    await page.waitForLoadState("networkidle")

    // El servidor debe rechazar: el saldo no se movió $999,999 pesos.
    const saldoDespues = await fx.saldoDeCuentaId(cuentaId)
    expect(saldoDespues).toBe(saldoAntes)
  })
})
