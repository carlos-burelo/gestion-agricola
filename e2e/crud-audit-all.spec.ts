import { test, expect } from "@playwright/test"

test.describe("AUDITORÍA COMPLETA DE FORMULARIOS CRUD DEL SISTEMA MGZ", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Iniciar sesión como Admin
    await page.goto("/login")
    await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
    await page.waitForURL("**/dashboard")
  })

  test("1. Registro y edición de Cuentas Bancarias (/dashboard/bancos)", async ({ page }) => {
    await page.goto("/dashboard/bancos")
    await expect(page.getByText("Catálogo de Cuentas Bancarias").first()).toBeVisible()

    await page.getByRole("button", { name: /nueva cuenta bancaria/i }).first().click()
    await expect(page.getByText("Nueva Cuenta Bancaria").first()).toBeVisible()

    const timestamp = Date.now()
    const testAccName = `Cuenta Audit ${timestamp}`

    await page.locator("#create-nombre").fill(testAccName)
    await page.locator("#create-bancoNombre").fill("BBVA")
    await page.locator("#create-numeroCuenta").fill("123456789012345678")
    await page.locator("#create-saldoInicial").fill("50000")

    await page.getByRole("button", { name: /registrar cuenta/i }).first().click()
    await expect(page.getByText(testAccName).first()).toBeVisible({ timeout: 10000 })
  })

  test("2. Registro de Ranchos (/dashboard/ranchos)", async ({ page }) => {
    await page.goto("/dashboard/ranchos")
    await expect(page.getByRole("heading", { name: /Ranchos/i }).first()).toBeVisible()

    await page.getByRole("button", { name: /nuevo/i }).first().click()

    const timestamp = Date.now()
    const ranchoName = `Rancho Audit ${timestamp}`

    await page.locator('input[name="nombre"]').fill(ranchoName)
    await page.getByRole("button", { name: /guardar/i }).first().click()

    await expect(page.getByText(ranchoName).first()).toBeVisible({ timeout: 10000 })
  })

  test("3. Registro de Parcelas MD2 (/dashboard/parcelas)", async ({ page }) => {
    await page.goto("/dashboard/parcelas")
    await expect(page.getByRole("heading", { name: /Parcelas/i }).first()).toBeVisible()

    await page.getByRole("button", { name: /nuevo|nueva/i }).first().click()

    const timestamp = Date.now()
    const parcelId = `Lote-Audit-${timestamp}`

    await page.locator('input[name="identificador"]').fill(parcelId)
    await page.locator('input[name="superficieM2"]').fill("15000")

    await page.getByRole("button", { name: /guardar/i }).first().click()
  })

  test("4. Registro de Productos e Insumos (/dashboard/productos)", async ({ page }) => {
    await page.goto("/dashboard/productos")
    await expect(page.getByRole("heading", { name: /Productos/i }).first()).toBeVisible()

    await page.getByRole("button", { name: /nuevo/i }).first().click()

    const timestamp = Date.now()
    const prodName = `Fertilizante Audit ${timestamp}`

    await page.locator('input[name="nombreComercial"]').fill(prodName)
    await page.locator('input[name="ingredienteActivo"]').fill("Nitrógeno 30%")
    await page.locator('input[name="presentacion"]').fill("Tambor 20L")
    await page.locator('input[name="unidadMedida"]').fill("Litro")

    await page.getByRole("button", { name: /guardar/i }).first().click()
    await expect(page.getByText(prodName).first()).toBeVisible({ timeout: 10000 })
  })

  test("5. Registro de Proveedores (/dashboard/proveedores)", async ({ page }) => {
    await page.goto("/dashboard/proveedores")
    await expect(page.getByRole("heading", { name: /Proveedores/i }).first()).toBeVisible()

    await page.getByRole("button", { name: /nuevo/i }).first().click()

    const timestamp = Date.now()
    const provName = `AgroInsumos Audit S.A. ${timestamp}`

    await page.locator('input[name="razonSocial"]').fill(provName)
    await page.locator('input[name="contacto"]').fill("Ing. Roberto Gómez")
    await page.locator('input[name="telefonoPrincipal"]').fill("2741234567")
    await page.locator('input[name="email"]').fill(`ventas${timestamp}@agro.com`)

    await page.getByRole("button", { name: /guardar/i }).first().click()
    await expect(page.getByText(provName).first()).toBeVisible({ timeout: 10000 })
  })

  test("6. Registro de Actividades de Campo (/dashboard/actividades)", async ({ page }) => {
    await page.goto("/dashboard/actividades")
    await expect(page.getByRole("heading", { name: /Actividades/i }).first()).toBeVisible()

    await page.getByRole("button", { name: /nuevo/i }).first().click()

    const timestamp = Date.now()
    const activityName = `Deshierbe Audit ${timestamp}`

    await page.locator('input[name="nombre"]').fill(activityName)

    await page.getByRole("button", { name: /guardar/i }).first().click()
    await expect(page.getByText(activityName).first()).toBeVisible({ timeout: 10000 })
  })

  test("7. Transferencias Bancarias (/dashboard/bancos/transferencias)", async ({ page }) => {
    await page.goto("/dashboard/bancos/transferencias")
    await expect(page.getByRole("heading", { name: /TRANSFERENCIAS BANCARIAS/i }).first()).toBeVisible()

    const timestamp = Date.now()
    await page.locator('#monto').fill("1500")
    await page.locator('#folio').fill(`SPEI-${timestamp}`)

    await expect(page.getByRole("button", { name: /guardar transferencia/i }).first()).toBeEnabled()
  })

  test("8. Administración de Usuarios y Roles (/dashboard/usuarios)", async ({ page }) => {
    await page.goto("/dashboard/usuarios")
    await expect(page.getByRole("heading", { name: /Administración de Usuarios/i }).first()).toBeVisible()

    await page.getByRole("button", { name: /nuevo usuario/i }).first().click()

    const timestamp = Date.now()
    const userName = `Operador Campo ${timestamp}`
    const userEmail = `operador${timestamp}@mgz.mx`

    await page.locator('#create-nombre').fill(userName)
    await page.locator('#create-email').fill(userEmail)
    await page.locator('#create-password').fill("clave12345")

    await page.getByRole("button", { name: /crear usuario/i }).first().click()
    await expect(page.getByText(userName).first()).toBeVisible({ timeout: 10000 })
  })
})
