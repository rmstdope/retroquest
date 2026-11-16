/**
 * The title page works from the keyboard: the cream ring starts on the main
 * choice, the arrow keys move it round the choices and Enter picks.
 */
import { test, expect } from './fixtures'

test('a returning player moves the ring with the arrows and picks with Enter', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('retroquest_settings'))
      localStorage.setItem('retroquest_settings', '{"narrationVolume":0}')
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page
    .getByRole('button', { name: /^Type( a command)?$/ })
    .first()
    .click()
  const input = page.getByLabel('Command')
  await input.fill('save')
  await input.press('Enter')
  await expect(page.getByText('Game saved').first()).toBeVisible()
  await page.reload()

  const cont = page.getByRole('button', { name: /^Continue/ })
  const fresh = page.getByRole('button', { name: 'New game' })
  const load = page.getByRole('button', { name: 'Load game' })
  await expect(cont).toBeFocused()
  await expect(cont).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('ArrowDown')
  await expect(fresh).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await expect(load).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(cont).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.lq-title-page')).toHaveCount(0)
})
