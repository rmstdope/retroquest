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
  // The dialog takes focus a tick after it opens; keys pressed before that
  // reach the page behind it and scroll nothing.
  await expect
    .poll(() =>
      page.evaluate(
        () => !!document.activeElement?.closest('.lq-dialog-panel'),
      ),
    )
    .toBe(true)
  // End scrolls to the height the body has when it is pressed, so wait for the
  // short window to lay the text out as taller than its box first.
  await expect
    .poll(() => body.evaluate((el) => el.scrollHeight > el.clientHeight))
    .toBe(true)
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

test('Save: a moving pointer takes the ring and the ring follows it', async ({
  page,
}): Promise<void> => {
  await openMenu(page)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const slot = page.locator('.lq-slot-btn').nth(3)
  const box = await slot.boundingBox()
  if (!box) throw new Error('slot 4 has no box')
  await page.mouse.move(box.x + 4, box.y + 4)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 5,
  })
  await expect(slot).toBeFocused()
})

test('The menu: only the ringed entry looks picked when the pointer rests on another', async ({
  page,
}): Promise<void> => {
  await openMenu(page)
  const save = page.getByRole('button', { name: 'Save', exact: true })
  const quit = page.getByRole('button', { name: 'Quit', exact: true })
  const help = page.getByRole('button', { name: 'Help', exact: true })
  const fill = (entry: typeof quit): Promise<string> =>
    entry.evaluate((el) => getComputedStyle(el).backgroundColor)
  // Each entry against its own unpicked look: Quit has no glass of its own.
  const plain = await fill(help)
  const quitPlain = await fill(quit)
  const box = await quit.boundingBox()
  if (!box) throw new Error('Quit has no box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  // The keyboard moves the ring off Save and back while the pointer rests on Quit.
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  await expect(save).toBeFocused()
  expect(await fill(quit)).toBe(quitPlain)
  await expect.poll(() => fill(save)).not.toBe(plain)
})
