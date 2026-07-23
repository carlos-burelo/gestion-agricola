import { test, expect } from "@playwright/test"

const ADMIN = { email: "admin@mgz.mx", password: "admin123" }
const ADMINIS = { email: "adminis@mgz.mx", password: "adminis123" }
const OPERADOR = { email: "operador@mgz.mx", password: "operador123" }
const INVENTARIO = { email: "inventario@mgz.mx", password: "inventario123" }

test.describe("SUITE DE PRUEBAS COMPLETA E2E — MGZ, S. DE P.R. DE R.L.", () => {
  test.setTimeout(60000)

  /* -------------------------------------------------------------------------- */
  /* BLOQUE 1: ROLES, PERMISOS Y CONTROL DE ACCESO                               */
  /* -------------------------------------------------------------------------- */
  test.describe("1. Autenticación y Matriz de Permisos por Rol", () => {
    test("1.1 Admin General — Acceso total e intercambio de Pestañas Ejecutivas", async ({ page }) => {
      await page.goto("/login")
      await page.locator("#email").fill(ADMIN.email)
      await page.locator("#password").fill(ADMIN.password)
      await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
      await page.waitForURL("**/dashboard")

      await expect(page.getByText("ADMINISTRADOR GENERAL").first()).toBeVisible()

      await page.getByRole("tab", { name: /finanzas/i }).click()
      await expect(page.getByText("Saldo Bancario Total").first()).toBeVisible()

      await page.getByRole("tab", { name: /campo/i }).click()
      await expect(page.getByText("Ranchos Activos").first()).toBeVisible()

      await page.getByRole("tab", { name: /almacén/i }).click()
      await expect(page.getByText("Valor de Inventario").first()).toBeVisible()
    })

    test("1.2 Rol Administrativo — Acceso a Finanzas y Bancos", async ({ page }) => {
      await page.goto("/login")
      await page.locator("#email").fill(ADMINIS.email)
      await page.locator("#password").fill(ADMINIS.password)
      await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
      await page.waitForURL("**/dashboard")

      await expect(page.getByText("ADMINISTRATIVO & FINANZAS").first()).toBeVisible()
      await expect(page.getByText("Saldo Bancario Total").first()).toBeVisible()
    })

    test("1.3 Rol Operativo — Acceso a Campo y Siembras", async ({ page }) => {
      await page.goto("/login")
      await page.locator("#email").fill(OPERADOR.email)
      await page.locator("#password").fill(OPERADOR.password)
      await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
      await page.waitForURL("**/dashboard")

      await expect(page.getByText("OPERATIVO DE CAMPO").first()).toBeVisible()
      await expect(page.getByText("Ranchos Activos").first()).toBeVisible()
    })

    test("1.4 Rol Inventario — Acceso a Almacén y Productos", async ({ page }) => {
      await page.goto("/login")
      await page.locator("#email").fill(INVENTARIO.email)
      await page.locator("#password").fill(INVENTARIO.password)
      await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
      await page.waitForURL("**/dashboard")

      await expect(page.getByText("GESTIÓN DE INVENTARIO").first()).toBeVisible()
      await expect(page.getByText("Valor de Inventario (PEPS)").first()).toBeVisible()
    })
  })

  /* -------------------------------------------------------------------------- */
  /* BLOQUE 2: FLUJO DE CAMPO Y ESTRUCTURA AGRÍCOLA                              */
  /* -------------------------------------------------------------------------- */
  test.describe("2. Flujo Completo Agrícola (Rancho -> Parcela -> Actividad)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login")
      await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
      await page.waitForURL("**/dashboard")
    })

    test("2.1 Creación de Rancho y Parcela MD2", async ({ page }) => {
      await page.goto("/dashboard/ranchos")
      await expect(page.getByRole("heading", { name: /Ranchos/i }).first()).toBeVisible()
      await page.getByRole("button", { name: /nuevo/i }).first().click()

      const ranchoName = `Rancho Suite ${Date.now()}`
      await page.locator('input[name="nombre"]').fill(ranchoName)
      await page.getByRole("button", { name: /guardar/i }).first().click()

      await page.locator('input[placeholder*="Buscar"]').first().fill(ranchoName)
      await expect(page.getByText(ranchoName).first()).toBeVisible({ timeout: 10000 })

      await page.goto("/dashboard/parcelas")
      await expect(page.getByRole("heading", { name: /Parcelas/i }).first()).toBeVisible()
      await page.getByRole("button", { name: /nuevo|nueva/i }).first().click()

      const parcelId = `Lote-Suite-${Date.now()}`
      await page.locator('input[name="identificador"]').fill(parcelId)
      await page.locator('input[name="superficieM2"]').fill("20000")
      await page.getByRole("button", { name: /guardar/i }).first().click()
    })

    test("2.2 Registro de Actividad Agrícola", async ({ page }) => {
      await page.goto("/dashboard/actividades")
      await expect(page.getByRole("heading", { name: /Actividades/i }).first()).toBeVisible()
      await page.getByRole("button", { name: /nuevo/i }).first().click()

      const actName = `Poda de Mantenimiento ${Date.now()}`
      await page.locator('input[name="nombre"]').fill(actName)
      await page.getByRole("button", { name: /guardar/i }).first().click()

      await page.locator('input[placeholder*="Buscar"]').first().fill(actName)
      await expect(page.getByText(actName).first()).toBeVisible({ timeout: 10000 })
    })
  })

  /* -------------------------------------------------------------------------- */
  /* BLOQUE 3: TESORERÍA, BANCOS Y TRANSFERENCIAS DE SOCIOS                     */
  /* -------------------------------------------------------------------------- */
  test.describe("3. Flujo Bancario y Transferencias de Fondos", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login")
      await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
      await page.waitForURL("**/dashboard")
    })

    test("3.1 Registro de Cuenta Bancaria con Titular Socio", async ({ page }) => {
      await page.goto("/dashboard/bancos")
      await expect(page.getByText("Catálogo de Cuentas Bancarias").first()).toBeVisible()
      await page.getByRole("button", { name: /nueva cuenta bancaria/i }).first().click()

      const accName = `BBVA Suite ${Date.now()}`
      await page.locator("#create-nombre").fill(accName)
      await page.locator("#create-bancoNombre").fill("BBVA")
      await page.locator("#create-numeroCuenta").fill("012345678901234567")
      await page.locator("#create-saldoInicial").fill("75000")

      await page.getByRole("button", { name: /registrar cuenta/i }).first().click()
      await expect(page.getByText(accName).first()).toBeVisible({ timeout: 10000 })
    })

    test("3.2 Transferencia SPEI entre Cuentas", async ({ page }) => {
      await page.goto("/dashboard/bancos/transferencias")
      await expect(page.getByRole("heading", { name: /TRANSFERENCIAS BANCARIAS/i }).first()).toBeVisible()

      const ts = Date.now()
      await page.locator("#monto").fill("2500")
      await page.locator("#folio").fill(`SPEI-SUITE-${ts}`)
      await page.locator("#observaciones").fill("Traspaso de prueba suite e2e")

      await expect(page.getByRole("button", { name: /guardar transferencia/i }).first()).toBeEnabled()
    })
  })

  /* -------------------------------------------------------------------------- */
  /* BLOQUE 4: ALMACÉN, INVENTARIOS Y PROVEEDORES                               */
  /* -------------------------------------------------------------------------- */
  test.describe("4. Gestión de Almacén, Productos y Proveedores", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login")
      await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
      await page.waitForURL("**/dashboard")
    })

    test("4.1 Registro de Insumo Agrícola", async ({ page }) => {
      await page.goto("/dashboard/productos")
      await expect(page.getByRole("heading", { name: /Productos/i }).first()).toBeVisible()
      await page.getByRole("button", { name: /nuevo/i }).first().click()

      const prodName = `Fungicida Suite ${Date.now()}`
      await page.locator('input[name="nombreComercial"]').fill(prodName)
      await page.locator('input[name="ingredienteActivo"]').fill("Cobre Orgánico")
      await page.locator('input[name="presentacion"]').fill("Garrafa 5L")
      await page.locator('input[name="unidadMedida"]').fill("Litro")

      await page.getByRole("button", { name: /guardar/i }).first().click()

      await page.locator('input[placeholder*="Buscar"]').first().fill(prodName)
      await expect(page.getByText(prodName).first()).toBeVisible({ timeout: 10000 })
    })

    test("4.2 Registro de Proveedor de Insumos", async ({ page }) => {
      await page.goto("/dashboard/proveedores")
      await expect(page.getByRole("heading", { name: /Proveedores/i }).first()).toBeVisible()
      await page.getByRole("button", { name: /nuevo/i }).first().click()

      const provName = `Distribuidora Agrícola Suite ${Date.now()}`
      await page.locator('input[name="razonSocial"]').fill(provName)
      await page.locator('input[name="contacto"]').fill("Lic. Alejandro M.")
      await page.locator('input[name="telefonoPrincipal"]').fill("2749876543")

      await page.getByRole("button", { name: /guardar/i }).first().click()

      await page.locator('input[placeholder*="Buscar"]').first().fill(provName)
      await expect(page.getByText(provName).first()).toBeVisible({ timeout: 10000 })
    })
  })

  /* -------------------------------------------------------------------------- */
  /* BLOQUE 5: USUARIOS Y HERRAMIENTAS DEL DASHBOARD                             */
  /* -------------------------------------------------------------------------- */
  test.describe("5. Administración de Usuarios y Herramientas del Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login")
      await page.getByRole("button", { name: /iniciar sesión/i }).first().click()
      await page.waitForURL("**/dashboard")
    })

    test("5.1 Creación de Usuario con asignación de Rol", async ({ page }) => {
      await page.goto("/dashboard/usuarios")
      await expect(page.getByRole("heading", { name: /Administración de Usuarios/i }).first()).toBeVisible()
      await page.getByRole("button", { name: /nuevo usuario/i }).first().click()

      const ts = Date.now()
      const uName = `Usuario Suite ${ts}`
      const uEmail = `usuario.suite${ts}@mgz.mx`

      await page.locator("#create-nombre").fill(uName)
      await page.locator("#create-email").fill(uEmail)
      await page.locator("#create-password").fill("password1234")

      await page.getByRole("button", { name: /crear usuario/i }).first().click()
      await expect(page.getByText(uName).first()).toBeVisible({ timeout: 10000 })
    })

    test("5.2 Herramientas del Dashboard — Filtros y Exportación CSV", async ({ page }) => {
      await page.goto("/dashboard")
      await expect(page.getByText("Filtros de Analítica:").first()).toBeVisible()

      await page.getByRole("button", { name: /exportar csv/i }).first().click()
    })
  })
})
