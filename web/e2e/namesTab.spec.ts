/**
 * Names in the story reached with the keyboard: a name of someone or something
 * here is a Tab stop in the newest turn, Enter opens its menu, Escape closes it
 * and focus is back on the same name.
 */
import { test, expect, type Page } from '@playwright/test'

/** Let the scroll that focusing a name causes finish (it closes an open menu). */
async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      ),
  )
}

/**
 * Start a new game (narration off: the voice scrolling the story would close
 * an open menu) and close the opening chapter page.
 */
async function start(page: Page): Promise<void> {
  await page.addInitScript(() =>
    localStorage.setItem('retroquest_settings', '{"narrationOn":false}'),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

test('a name in the newest turn opens its menu from the keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await start(page)
  // The voice's answer wakes the player in Elior's Cottage, where Grandmother is.
  await page
    .getByRole('button', { name: /^Type( a command)?$/ })
    .first()
    .click()
  const input = page.getByLabel('Command')
  await input.fill('talk to voice')
  await input.press('Enter')
  const stop = page
    .locator('.lq-story .lq-turn')
    .last()
    .locator('[role="button"][tabindex="0"]')
    .first()
  await expect(stop).toHaveText('Grandmother')
  await stop.focus()
  await settle(page)
  await page.keyboard.press('Enter')
  const menu = page.locator('.lq-name-menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(stop).toBeFocused()
})

test("Tab reaches the newest turn's names between the stage buttons and the actions, and Space opens the menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await start(page)
  await page
    .getByRole('button', { name: /^Type( a command)?$/ })
    .first()
    .click()
  const input = page.getByLabel('Command')
  await input.fill('talk to voice')
  await input.press('Enter')
  const stop = page
    .locator('.lq-story .lq-turn')
    .last()
    .locator('[role="button"][tabindex="0"]')
    .first()
  await expect(stop).toHaveText('Grandmother')
  await page.locator('.lq-buttons button').last().focus()
  let reached = false
  for (let i = 0; i < 20 && !reached; i++) {
    await page.keyboard.press('Tab')
    reached = await stop.evaluate((el) => el === document.activeElement)
  }
  expect(reached).toBe(true)
  await settle(page)
  await page.keyboard.press('Space')
  const menu = page.locator('.lq-name-menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(stop).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(stop).not.toBeFocused()
})
