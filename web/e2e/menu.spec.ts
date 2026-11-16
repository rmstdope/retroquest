/**
 * The Escape menu: there is no top bar, ☰ and Escape open the menu, a window
 * opened from it comes back to it, Quit lands on the main menu, and F switches
 * full screen.
 */
import { test, expect, type Page } from './fixtures'

/** Start a new game on a laptop and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

test('has no top bar, and Escape opens the menu with focus on Save', async ({
  page,
}): Promise<void> => {
  await start(page)
  await expect(page.getByRole('banner')).toHaveCount(0)
  await expect(page.getByTestId('quest-progress')).toHaveCount(0)

  await page.keyboard.press('Escape')
  const menu = page.getByRole('dialog', { name: 'Menu' })
  await expect(menu).toBeVisible()
  await expect(menu.getByText('Paused')).toBeVisible()
  await expect(
    menu.getByRole('button', { name: 'Save', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(
    menu.getByRole('button', { name: 'Load', exact: true }),
  ).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
})

test('Settings comes back to the menu, and has the Full screen switch', async ({
  page,
}): Promise<void> => {
  await start(page)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Full screen' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Settings', exact: true }),
  ).toBeFocused()
})

test('Quit asks first, Cancel goes back, and quitting lands on the main menu', async ({
  page,
}): Promise<void> => {
  await start(page)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Quit', exact: true }).click()
  const question = page.getByRole('dialog', { name: 'Quit to the main menu?' })
  await expect(question.getByRole('button', { name: 'Cancel' })).toBeFocused()

  await question.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()

  await page.getByRole('button', { name: 'Quit', exact: true }).click()
  await question.getByRole('button', { name: 'Quit without saving' }).click()
  await expect(page.locator('.lq-title-page')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
})

test('Escape does nothing on the title page', async ({
  page,
}): Promise<void> => {
  await page.goto('/')
  await expect(page.locator('.lq-title-page')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.lq-title-page')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
})
