/**
 * The screens the Escape menu opens work from the keyboard: the cream ring
 * starts in its place, the arrows follow the slot grid and Settings' rows,
 * Enter chooses, Help scrolls, Quit moves between its buttons, and Escape goes
 * back with the ring on the entry the screen came from.
 */
import { test, expect, type Page } from './fixtures'

/** Start a new game on a laptop, close the chapter page and open the menu. */
async function openMenu(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
}

test('Save: the ring starts on the first empty slot and the arrows follow the grid', async ({
  page,
}): Promise<void> => {
  await openMenu(page)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const badge = (): ReturnType<Page['evaluate']> =>
    page.evaluate(
      () =>
        document.activeElement
          ?.closest('.lq-slot')
          ?.querySelector('.lq-slot-badge')?.textContent,
    )
  expect(await badge()).toBe('1')
  await page.keyboard.press('ArrowRight')
  expect(await badge()).toBe('2')
  await page.keyboard.press('ArrowDown')
  expect(await badge()).toBe('4')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowLeft')
  expect(await badge()).toBe('1')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Just saved')).toBeVisible()
  expect(await badge()).toBe('1')
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Save', exact: true }),
  ).toBeFocused()
})

test('Settings: ↑ ↓ move between rows and ← → change them', async ({
  page,
}): Promise<void> => {
  await openMenu(page)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const row = (): ReturnType<Page['evaluate']> =>
    page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.stop,
    )
  expect(await row()).toBe('theme')
  // A pointer resting over the list never takes the ring when it scrolls.
  await page.mouse.move(640, 400)
  await page.keyboard.press('ArrowRight')
  await expect(
    page.getByRole('button', { name: 'Light', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('ArrowUp')
  expect(await row()).toBe('alwaysShowNames')
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('switch', { name: "Always show what's here" }),
  ).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Settings', exact: true }),
  ).toBeFocused()
})

test('Help scrolls with the keys; Quit moves between its buttons', async ({
  page,
}): Promise<void> => {
  await openMenu(page)
  await page.getByRole('button', { name: 'Help', exact: true }).click()
  const body = page.locator('.lq-dialog-content')
  await page.setViewportSize({ width: 1280, height: 300 })
  await page.keyboard.press('End')
  await expect
    .poll(() =>
      body.evaluate(
        (el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1,
      ),
    )
    .toBe(true)
  await page.keyboard.press('Home')
  await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBe(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Quit', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(
    page.getByRole('button', { name: 'Quit without saving' }),
  ).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
})
