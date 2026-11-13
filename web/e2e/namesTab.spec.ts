/**
 * Names in the story reached with the keyboard: a name of someone or something
 * here is a Tab stop in the newest turn, Enter opens its menu, Escape closes it
 * and focus is back on the same name.
 */
import { test, expect, type Page } from './fixtures'

/** Let the browser report the scroll that focusing a name causes. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      ),
  )
}

/** The arrival is told on the picture first (laptop): Escape sends it away so the story is read. */
async function clearArrival(page: Page): Promise<void> {
  const told = page.locator('.lq-arrival-card')
  await expect(told.last()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(told).toHaveCount(0)
}

/**
 * Start a new game (narration at volume 0: the voice scrolling the story would close
 * an open menu) and close the opening chapter page.
 */
async function start(page: Page): Promise<void> {
  await page.addInitScript(() =>
    localStorage.setItem('retroquest_settings', '{"narrationVolume":0}'),
  )
  // The waking is told in the dark of a change of scene, which the suite's reduced motion skips.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
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
  // The waking is told in the middle of the dark first; Enter brings the cottage up.
  await page.getByTestId('scene-interlude').waitFor()
  await page.keyboard.press('Enter')
  await clearArrival(page)
  // The quest news is told in the middle and leaves only slim lines: look
  // around for a turn that names who is here.
  await input.fill('look')
  await input.press('Enter')
  const stop = page
    .locator('.lq-story .lq-turn')
    .last()
    .locator('[role="button"][tabindex="0"]')
    .first()
  await expect(stop).toHaveText('Grandmother')
  await stop.focus()
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
  // The waking is told in the middle of the dark first; Enter brings the cottage up.
  await page.getByTestId('scene-interlude').waitFor()
  await page.keyboard.press('Enter')
  await clearArrival(page)
  // The quest news is told in the middle and leaves only slim lines: look
  // around for a turn that names who is here.
  await input.fill('look')
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
  await page.keyboard.press('Space')
  const menu = page.locator('.lq-name-menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(stop).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(stop).not.toBeFocused()
})

test('in the Story so far drawer, Enter at once on a name just scrolled into view opens its menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await start(page)
  await page
    .getByRole('button', { name: /^Type( a command)?$/ })
    .first()
    .click()
  const input = page.getByLabel('Command')
  // Wake in Elior's Cottage, then look about until the story is long enough
  // that its first names are out of the drawer's sight.
  for (const command of ['talk to voice', 'look', 'look', 'look', 'look']) {
    await input.fill(command)
    await input.press('Enter')
  }
  await page.getByRole('button', { name: /Story so far/ }).click()
  const drawer = page.locator('.lq-story-drawer')
  const body = drawer.locator('.lq-story-drawer-body')
  await expect(body).toBeFocused()
  const first = drawer.locator('[role="button"][tabindex="0"]').first()
  await expect(first).not.toBeInViewport()
  // No pause: the name takes focus (the drawer scrolls it into view) and Enter
  // comes in the same frame, before that scroll's event is delivered.
  await first.evaluate((name) => {
    name.focus()
    name.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
  await settle(page)
  const menu = page.locator('.lq-name-menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem').first()).toBeFocused()
})
