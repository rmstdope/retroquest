/**
 * The title page waits for the player: the picture and the name first, a quiet
 * hint if nothing is pressed, and the menu only at a key, a click or a touch.
 */
import { test, expect, type Page } from './fixtures'

test.use({ titleWaits: true })

/** Wait until the game has loaded and the title page is up. */
async function waitForGame(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const app = (document.querySelector('#app') as any).__vue_app__
    return app && !app.config.globalProperties.$pinia.state.value.game.loading
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
}

const opacity = (page: Page, selector: string): Promise<string> =>
  page.locator(selector).evaluate((el) => getComputedStyle(el).opacity)

test('shows only the picture and the name until a key is pressed, then the menu together', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await waitForGame(page)
  const start = page.getByRole('button', { name: 'Start', exact: true })
  await expect(page.locator('.lq-title-page')).toHaveClass(/is-playing/)
  await expect(page.locator('.lq-title-buttons')).toHaveAttribute('inert')
  await expect(page.locator('.lq-credit')).toHaveAttribute('inert')
  expect(await opacity(page, '.lq-title-dock')).toBe('0')
  expect(await opacity(page, '.lq-credit')).toBe('0')

  await page.evaluate(() => (document.activeElement as HTMLElement).blur())
  await page.keyboard.press('Enter')
  await expect(page.locator('.lq-title-page')).toHaveClass(/is-open/)
  await expect(start).toBeFocused()
  await expect(page.locator('.lq-title-page')).toBeVisible()
  await expect(async () => {
    expect(await opacity(page, '.lq-title-dock')).toBe('1')
    expect(await opacity(page, '.lq-credit')).toBe('1')
  }).toPass({ timeout: 2000 })
})

test('a click where Start will appear only brings the menu', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await waitForGame(page)
  const box = (await page.locator('.lq-title-buttons').boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + 20)
  await expect(page.locator('.lq-title-page')).toHaveClass(/is-open/)
  await expect(
    page.getByRole('button', { name: 'Start', exact: true }),
  ).toBeFocused()
  await expect(page.locator('.lq-title-page')).toBeVisible()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.locator('.lq-title-page')).toHaveCount(0)
})

test('a hint appears 5 s after the name is up, and goes at a press', async ({
  page,
}) => {
  await page.clock.install()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await waitForGame(page)
  const hint = page.locator('.lq-title-hint')
  await page.clock.runFor(9000)
  await expect(hint).toHaveText('')
  await page.clock.runFor(600)
  await expect(hint).toHaveText('Press any key')
  await expect(hint).toHaveCSS('text-transform', 'uppercase')
  await page.keyboard.press('Space')
  await expect(hint).toHaveText('')
})

test('with less motion the page is still, and the hint appears after 5 s', async ({
  page,
}) => {
  await page.clock.install()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await waitForGame(page)
  expect(await opacity(page, '.lq-title-name')).toBe('1')
  expect(await opacity(page, '.lq-title-dock')).toBe('0')
  await page.clock.runFor(5100)
  await expect(page.locator('.lq-title-hint')).toHaveText('Press any key')
})

test('waits again when the player comes back to the title from the game', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await waitForGame(page)
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.locator('.lq-title-page')).toHaveCount(0)
  await page.locator('.lq-chapter-button').click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Quit', exact: true }).click()
  await page.getByRole('button', { name: 'Quit without saving' }).click()
  await expect(page.locator('.lq-title-page')).toHaveClass(/is-playing/)
})
