/**
 * The cream ring in Settings is always drawn whole: when the arrows, a wrap
 * round or Tab bring a row to either end of the scrolling list, the list
 * scrolls a little further so the ring and its gap are not clipped.
 */
import { test, expect, type Page } from './fixtures'

/** The ring reaches this far (px) outside the row: 3px width + 3px offset. */
const RING_REACH = 6

/** Open Settings on a short window, so the list has to scroll. */
async function openSettings(page: Page): Promise<void> {
  await page.setViewportSize({ width: 900, height: 480 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
}

/** How far (px) the focused row's ring sticks out past the list's edges. */
async function clipped(page: Page): Promise<number> {
  return page.evaluate((reach: number) => {
    const row = document.activeElement?.closest('.lq-stop') ?? null
    const list = document.querySelector('.lq-dialog-content')
    if (!row || !list) return Number.POSITIVE_INFINITY
    const r = row.getBoundingClientRect()
    const l = list.getBoundingClientRect()
    return Math.max(l.top - (r.top - reach), r.bottom + reach - l.bottom, 0)
  }, RING_REACH)
}

test('Settings: the ring is whole on the last row and on the first', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  await page.keyboard.press('ArrowUp')
  expect(await clipped(page)).toBe(0)
  await page.keyboard.press('ArrowDown')
  expect(await clipped(page)).toBe(0)
})

test('Settings: the ring is whole on every row walked down with the arrow keys', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('ArrowDown')
    expect(await clipped(page)).toBe(0)
  }
})
