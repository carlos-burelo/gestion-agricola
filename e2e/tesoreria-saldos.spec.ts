import { test, expect } from "@playwright/test"
import { TesoreriaFixtures } from "./helpers/fixtures"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@tesoreria.local"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave-123"

const CUENTAS_REALES = [
  "MGZ121", "MGZ BBVA", "MGZ DOLARES", "MGZ BAJIO",
  "VICTOR BANAMEX", "VICTOR BANORTE", "RODRIGO", "MOY",
  "NORMA RUTH", "VALERIA", "MANUEL BANAMEX", "ROBERTO",
  "JUAN", "NORMA SANCHEZ", "JOSE CARLOS", "LUIS ENRIQUE",
  "CESARIA", "ALAN", "ELVIA", "CAJA", "CAJA TIGRES", "RESERVA",
]

test.describe("Saldos — cruce independiente contra Postgres para las 22 cuentas reales", () => {
  let fx: TesoreriaFixtures

  test.beforeAll(() => {
    fx = new TesoreriaFixtures()
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

  for (const nombre of CUENTAS_REALES) {
    test(`el saldo mostrado para ${nombre} coincide con SQL directo (no con el propio cálculo de la app)`, async ({ page }) => {
      // Cálculo 100% independiente del código de la app: SQL crudo contra
      // la misma base que usa la UI. Si esto pasa, la UI refleja lo que
      // realmente hay en la base, no un valor que la app "inventó" y se
      // auto-confirma.
      const saldoReal = await fx.saldoRealDeCuenta(nombre)
      const formateado = saldoReal.toLocaleString("es-MX", {
        style: "currency",
        currency: nombre === "MGZ DOLARES" ? "USD" : "MXN",
      })

      await page.goto("/dashboard/tesoreria")
      // Coincidencia exacta: "CAJA" no debe matchear la tarjeta de "CAJA TIGRES".
      const tarjeta = page.locator(".grid.gap-3 > a", {
        has: page.getByText(nombre, { exact: true }),
      })
      await expect(tarjeta).toContainText(formateado)
    })
  }
})
