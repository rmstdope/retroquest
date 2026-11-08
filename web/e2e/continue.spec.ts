/**
 * A returning player picks a save up from the title page: Continue opens the
 * newest save at once, Load game opens the save window without a question,
 * New game starts afresh, and with no saves the page offers Start only.
 */
import { test, expect, type Page } from '@playwright/test'

/** Start a game, close the opening chapter page and save (a quick save, or under a name with `save <name>`). */
async function makeSave(page: Page, command = 'save'): Promise<void> {
  await page.addInitScript(() => {
    if (!localStorage.getItem('retroquest_settings'))
      localStorage.setItem('retroquest_settings', '{"narrationOn":false}')
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page
    .getByRole('button', { name: /^Type( a command)?$/ })
    .first()
    .click()
  const input = page.getByLabel('Command')
  await input.fill(command)
  await input.press('Enter')
  await expect(page.getByText('Game saved').first()).toBeVisible()
}

test('with no saves the title page offers Start only', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Start', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0)
})

test('Continue opens the newest save with no chapter page', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()

  const cont = page.getByRole('button', { name: /^Continue/ })
  await expect(cont).toBeFocused()
  await expect(cont).toContainText('Act I · The Dream')
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible()
  await cont.click()

  await expect(page.locator('.lq-title-page')).toHaveCount(0)
  await expect(page.locator('.lq-chapter-button')).toHaveCount(0)
  await expect(page.getByTestId('act')).toBeVisible()
})

test('Load game from the title page loads a card with no question', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()

  await page.getByRole('button', { name: 'Load game' }).click()
  const dialog = page.getByRole('dialog', { name: 'Load game' })
  await expect(dialog.getByText('Pick a save to go back to.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Load game' })).toBeFocused()

  await page.getByRole('button', { name: 'Load game' }).click()
  await dialog.locator('[data-slot="0"] .lq-slot-btn').click()
  await expect(page.locator('.lq-title-page')).toHaveCount(0)
  await expect(page.locator('.lq-chapter-button')).toHaveCount(0)
})

test('New game starts at the chapter page and keeps the saves', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()

  await page.getByRole('button', { name: 'New game' }).click()
  await expect(page.locator('.lq-chapter-button')).toBeVisible()
  const saved = await page.evaluate(() =>
    localStorage.getItem('retroquest_save'),
  )
  expect(saved).not.toBeNull()
})

test('a save made under a name is listed on the title page after a reload and loads', async ({
  page,
}) => {
  await makeSave(page, 'save mysave')
  await page.reload()

  const cont = page.getByRole('button', { name: /^Continue/ })
  await expect(cont).toContainText('mysave · Act I · The Dream')

  await page.getByRole('button', { name: 'Load game' }).click()
  const dialog = page.getByRole('dialog', { name: 'Load game' })
  await expect(dialog.getByText('Saves you named')).toBeVisible()
  await dialog.getByRole('button', { name: /^Load mysave:/ }).click()
  await expect(page.locator('.lq-title-page')).toHaveCount(0)
  await expect(page.getByTestId('act')).toBeVisible()
})
