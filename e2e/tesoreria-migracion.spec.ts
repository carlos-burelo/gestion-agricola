import { test, expect } from "@playwright/test"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@tesoreria.local"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave-123"

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.getByLabel("Correo").fill(ADMIN_EMAIL)
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD)
  await page.getByRole("button", { name: /entrar/i }).click()
  await page.waitForURL("**/dashboard/tesoreria")
}

test.describe("Auth", () => {
  test("una ruta de tesorería sin sesión redirige a /login", async ({ page }) => {
    await page.goto("/dashboard/tesoreria")
    await page.waitForURL("**/login")
    expect(page.url()).toContain("/login")
  })

  test("login con el admin de bootstrap entra al hub de tesorería", async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard\/tesoreria$/)
  })
})

test.describe("Migración histórica — datos reales del Excel", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("el hub muestra las 22 cuentas reales importadas", async ({ page }) => {
    await page.goto("/dashboard/tesoreria")

    const nombresEsperados = [
      "MGZ121", "MGZ BBVA", "MGZ DOLARES", "MGZ BAJIO",
      "VICTOR BANAMEX", "VICTOR BANORTE", "RODRIGO", "MOY",
      "NORMA RUTH", "VALERIA", "MANUEL BANAMEX", "ROBERTO",
      "JUAN", "NORMA SANCHEZ", "JOSE CARLOS", "LUIS ENRIQUE",
      "CESARIA", "ALAN", "ELVIA", "CAJA", "CAJA TIGRES", "RESERVA",
    ]
    for (const nombre of nombresEsperados) {
      await expect(page.getByText(nombre, { exact: true })).toBeVisible()
    }

    // 22 cuentas, ninguna de prueba/fixture filtrándose a la UI real.
    // Se escopea al grid de tarjetas (no al sidebar, que también linkea a
    // /dashboard/tesoreria/*).
    const tarjetas = page.locator(".grid.gap-3 > a")
    await expect(tarjetas).toHaveCount(nombresEsperados.length)

    // Saldo actual de MGZ121 (saldo inicial real $321,592.24 + movimientos
    // importados de todo 2025) debe coincidir exacto con lo calculado
    // independientemente contra la base de datos real.
    await expect(page.getByText("$46,490.32")).toBeVisible()
  })

  test("el ledger de MGZ121 muestra el saldo inicial real y sus movimientos", async ({ page }) => {
    await page.goto("/dashboard/tesoreria")
    await page.getByText("MGZ121", { exact: true }).click()
    await page.waitForURL(/\/dashboard\/tesoreria\/[^/]+$/)

    await expect(page.getByText("Saldo inicial")).toBeVisible()
    await expect(page.getByText("$321,592.24")).toBeVisible()

    // 1,932 movimientos reales importados para esta cuenta — confirma que
    // el import no truncó ni duplicó filas para esta hoja del Excel.
    const filas = page.locator("tbody tr")
    await expect(filas).toHaveCount(1932 + 1) // +1 por la fila de saldo inicial
  })

  test("la matriz mensual de enero 2025 reproduce el total real del Excel para VENTA PIÑAS", async ({ page }) => {
    await page.goto("/dashboard/tesoreria/reportes/mensual?mes=1&anio=2025")

    const filaVentaPinas = page.locator("tr", { hasText: "VENTA PIÑAS" })
    await expect(filaVentaPinas).toBeVisible()
    // $10,026,802.00 es el total real de la hoja ENE25 del Excel origen
    // (columna Y, fila VENTA PIÑAS) — verificado de forma independiente
    // contra la base de datos antes de este test.
    await expect(filaVentaPinas.getByText("$10,026,802.00")).toBeVisible()
  })
})
