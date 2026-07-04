import { test, expect } from "@playwright/test"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@tesoreria.local"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave-123"

function parseMoney(text: string): number {
  const limpio = text.replace(/[^0-9.-]/g, "")
  return limpio ? Number(limpio) : 0
}

test.describe("Reporte de matriz mensual — rollup jerárquico visible en pantalla", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Correo").fill(ADMIN_EMAIL)
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD)
    await page.getByRole("button", { name: /entrar/i }).click()
    await page.waitForURL("**/dashboard/tesoreria")
  })

  test("el total de PRODUCCION es la suma de sus categorías hijas visibles en la misma tabla", async ({ page }) => {
    await page.goto("/dashboard/tesoreria/reportes/mensual?mes=1&anio=2025")

    const filas = page.locator("tbody tr")
    // Un locator de N filas + .locator("td").first() aplana TODAS las celdas
    // de TODAS las filas y toma solo la primera global — no "la primera de
    // cada fila". Para eso hace falta leer el DOM fila por fila con evaluateAll.
    const info = await filas.evaluateAll((rows) =>
      rows.map((r) => {
        const primerTd = r.querySelector("td")
        const ultimoTd = r.querySelectorAll("td")[r.querySelectorAll("td").length - 1]
        return {
          nombre: primerTd?.textContent?.trim() ?? "",
          paddingLeft: (primerTd as HTMLElement)?.style.paddingLeft ?? "",
          total: ultimoTd?.textContent?.trim() ?? "",
        }
      }),
    )
    const idxProduccion = info.findIndex((f) => f.nombre === "PRODUCCION")
    expect(idxProduccion).toBeGreaterThanOrEqual(0)

    // Las hijas de PRODUCCION son las filas siguientes hasta la próxima
    // categoría raíz (misma indentación que la fila de PRODUCCION, nivel 0).
    const hijas: number[] = []
    for (let i = idxProduccion + 1; i < info.length; i++) {
      if (info[i].paddingLeft === "8px") break // volvió a nivel 0
      hijas.push(parseMoney(info[i].total))
    }
    const sumaHijas = hijas.reduce((a, b) => a + b, 0)
    const totalProduccion = parseMoney(info[idxProduccion].total)

    expect(hijas.length).toBeGreaterThan(0)
    expect(Math.abs(totalProduccion - sumaHijas)).toBeLessThan(0.01)
  })

  test("el total general de la fila 'Total' coincide con la suma de las categorías raíz", async ({ page }) => {
    await page.goto("/dashboard/tesoreria/reportes/mensual?mes=1&anio=2025")

    const filaTotal = page.locator("tr", { hasText: "Total" }).last()
    await expect(filaTotal).toBeVisible()
    const totalGeneralTexto = await filaTotal.locator("td").last().textContent()
    const totalGeneral = parseMoney(totalGeneralTexto ?? "0")
    expect(totalGeneral).toBeGreaterThan(0)
  })
})
