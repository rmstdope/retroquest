/**
 * The cream ring in Settings is always drawn whole: when the arrows, a wrap
 * round or Tab bring a row to either end of the scrolling list, the list
 * scrolls a little further so the ring and its gap are not clipped.
 */
import { test, expect, type Page } from './fixtures'

/** The ring reaches this far (px) outside the row: 3px width + 3px offset. */
const RING_REACH = 6

/** Open Settings on a short window, so the list has to scroll. */
async function openSettings(page: Page, width = 900): Promise<void> {
  await page.setViewportSize({ width, height: 480 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
}

/** '0' when the focused row's ring is whole, else how far it sticks out. */
async function clipped(page: Page): Promise<string> {
  return page.evaluate((reach: number) => {
    const list = document.querySelector('.lq-dialog-content')
    const active = document.activeElement
    if (!list || !active) return 'no list or focus'
    // Focus outside the scrolling list (the close button) has nothing to clip.
    if (!list.contains(active)) return '0'
    const row = active.closest('.lq-stop') ?? active
    const r = row.getBoundingClientRect()
    const l = list.getBoundingClientRect()
    const out = Math.max(
      l.top - (r.top - reach),
      r.bottom + reach - l.bottom,
      0,
    )
    return out === 0
      ? '0'
      : `${out}px: ${active.tagName} row ${r.top}-${r.bottom} list ${l.top}-${l.bottom}`
  }, RING_REACH)
}

test('Settings: the ring is whole on the last row and on the first', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  await page.keyboard.press('ArrowUp')
  await expect.poll(() => clipped(page)).toBe('0')
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => clipped(page)).toBe('0')
})

test('Settings: the ring is whole on every row walked down with the arrow keys', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => clipped(page)).toBe('0')
  }
})

test('Settings: the ring is whole on every stop Tab reaches, on a phone too', async ({
  page,
}): Promise<void> => {
  await openSettings(page, 390)
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    await expect.poll(() => clipped(page)).toBe('0')
  }
})
