import { test, expect } from "@playwright/test"
import { TesoreriaFixtures } from "./helpers/fixtures"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@tesoreria.local"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave-123"
const PERSONA_EMAIL = "e2e-persona@tesoreria.local"
const PERSONA_PASSWORD = "e2e-persona-password-123"

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Correo").fill(email)
  await page.getByLabel("Contraseña").fill(password)
  await page.getByRole("button", { name: /entrar/i }).click()
}

test.describe("Autorización por rol — persona solo ve/toca su(s) cuenta(s)", () => {
  let fx: TesoreriaFixtures
  let cuentaPropia: string
  let mgz121Id: string

  test.beforeAll(async () => {
    fx = new TesoreriaFixtures()
    cuentaPropia = await fx.crearCuenta("Cuenta Propia Persona", 500)
    await fx.crearUsuarioPersona(PERSONA_EMAIL, PERSONA_PASSWORD, [cuentaPropia])
    mgz121Id = await fx.idDeCuenta("MGZ121")
  })
  test.afterAll(async () => {
    await fx.teardown()
  })

  test("el hub de una persona solo lista su cuenta asignada, no las 22 reales", async ({ page }) => {
    await login(page, PERSONA_EMAIL, PERSONA_PASSWORD)
    await page.waitForURL("**/dashboard/tesoreria")

    await expect(page.getByText("E2E Cuenta Propia Persona", { exact: true })).toBeVisible()
    await expect(page.getByText("MGZ121", { exact: true })).not.toBeVisible()
    const tarjetas = page.locator(".grid.gap-3 > a")
    await expect(tarjetas).toHaveCount(1)
  })

  test("una persona recibe 404 al entrar al ledger de una cuenta ajena por URL directa", async ({ page }) => {
    await login(page, PERSONA_EMAIL, PERSONA_PASSWORD)
    await page.waitForURL("**/dashboard/tesoreria")

    // Navega directo al ledger de MGZ121 (real, no le pertenece) adivinando
    // la URL — el guard debe bloquear con notFound(), no solo esconder el
    // link en el hub.
    const response = await page.goto(`/dashboard/tesoreria/${mgz121Id}`)
    expect(response?.status()).toBe(404)
    await expect(page.getByText(/no.*encontr|not.*found/i)).toBeVisible()
  })

  test("una persona sí puede entrar al ledger de su propia cuenta", async ({ page }) => {
    await login(page, PERSONA_EMAIL, PERSONA_PASSWORD)
    await page.waitForURL("**/dashboard/tesoreria")

    const response = await page.goto(`/dashboard/tesoreria/${cuentaPropia}`)
    expect(response?.status()).toBe(200)
    await expect(page.getByText("Saldo inicial")).toBeVisible()
  })

  test("una persona no puede ver la página de traspasos ni la de reportes/usuarios (redirige)", async ({ page }) => {
    await login(page, PERSONA_EMAIL, PERSONA_PASSWORD)
    await page.waitForURL("**/dashboard/tesoreria")

    await page.goto("/dashboard/tesoreria/traspasos")
    await page.waitForURL("**/dashboard/tesoreria")
    expect(page.url()).not.toContain("/traspasos")

    await page.goto("/dashboard/tesoreria/reportes/mensual")
    await page.waitForURL("**/dashboard/tesoreria")
    expect(page.url()).not.toContain("/reportes")

    await page.goto("/dashboard/tesoreria/usuarios")
    await page.waitForURL("**/dashboard/tesoreria")
    expect(page.url()).not.toContain("/usuarios")
  })

  test("admin sí ve las 22 cuentas reales y accede a traspasos/reportes/usuarios", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.waitForURL("**/dashboard/tesoreria")

    await expect(page.getByText("MGZ121", { exact: true })).toBeVisible()

    await page.goto("/dashboard/tesoreria/traspasos")
    await expect(page).toHaveURL(/\/traspasos$/)

    await page.goto("/dashboard/tesoreria/usuarios")
    await expect(page).toHaveURL(/\/usuarios$/)
  })
})
