import type { Page } from "@playwright/test"

/**
 * Los <select> de tesorería son el componente Select de shadcn/ui (Base UI
 * bajo el capó, no un <select> nativo) — no soportan `selectOption()`. Se
 * abren con click y se elige la opción por su texto visible.
 */
export async function selectShadcn(page: Page, label: string, optionText: string) {
  const option = page.getByRole("option", { name: optionText, exact: true })
  await page.getByLabel(label).click()
  await option.click()
  // El popup de Base UI cierra con una transición breve; si el siguiente
  // click (ej. el botón de submit) llega antes de que termine, el overlay
  // de cierre todavía intercepta el puntero. Esperar a que el option se
  // desmonte confirma que el popup ya cerró de verdad.
  await option.waitFor({ state: "hidden" })
}
