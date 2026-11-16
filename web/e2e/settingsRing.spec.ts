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

/**
 * Scroll the list by hand so only `visible` px of the fourth row show at the
 * foot or the head, and return a point inside that visible part.
 */
async function cutRow(
  page: Page,
  edge: 'foot' | 'head',
  visible: number,
): Promise<{ x: number; y: number }> {
  return page.evaluate(
    ({ edge, visible }) => {
      const list = document.querySelector('.lq-dialog-content')
      const row = list?.querySelectorAll('[data-stop]')[3]
      if (!(list instanceof HTMLElement) || !row) throw new Error('no row')
      list.scrollTop = 0
      const l = list.getBoundingClientRect()
      const r = row.getBoundingClientRect()
      list.scrollTop =
        edge === 'foot'
          ? r.top - (l.bottom - visible)
          : r.bottom - (l.top + visible)
      const n = row.getBoundingClientRect()
      return {
        x: n.left + n.width / 2,
        y: edge === 'foot' ? l.bottom - visible / 2 : l.top + visible / 2,
      }
    },
    { edge, visible },
  )
}

/** Move the mouse onto a point in two steps, so it really moves. */
async function pointAt(
  page: Page,
  at: { x: number; y: number },
): Promise<void> {
  await page.mouse.move(at.x - 20, at.y)
  await page.mouse.move(at.x, at.y)
}

/** The list's scroll position. */
async function scrolled(page: Page): Promise<number | undefined> {
  return page.evaluate(
    () => document.querySelector('.lq-dialog-content')?.scrollTop,
  )
}

test('Settings: a mouse on a row half hidden at the foot or the head brings the ring whole', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  await pointAt(page, await cutRow(page, 'foot', 26))
  await expect.poll(() => clipped(page)).toBe('0')
  await pointAt(page, await cutRow(page, 'head', 26))
  await expect.poll(() => clipped(page)).toBe('0')
})

test('Settings: a mouse on a sliver of a row brings the whole row in', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  await pointAt(page, await cutRow(page, 'foot', 4))
  await expect.poll(() => clipped(page)).toBe('0')
  await pointAt(page, await cutRow(page, 'head', 4))
  await expect.poll(() => clipped(page)).toBe('0')
})

test('Settings: a tap on a row half hidden at the foot brings the ring whole', async ({
  page,
}): Promise<void> => {
  await openSettings(page, 390)
  const at = await cutRow(page, 'foot', 26)
  await page.mouse.click(at.x, at.y)
  await expect.poll(() => clipped(page)).toBe('0')
})

test('Settings: scrolling by hand does not nudge back', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  await pointAt(page, await cutRow(page, 'foot', 26))
  await expect.poll(() => clipped(page)).toBe('0')
  await page.mouse.wheel(0, -2000)
  await page.waitForTimeout(300)
  expect(await scrolled(page)).toBe(0)
})

test('Settings: in a tall window the list never scrolls when pointed at', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  await page.setViewportSize({ width: 900, height: 1600 })
  await pointAt(page, { x: 450, y: 400 })
  await pointAt(page, { x: 450, y: 600 })
  expect(await scrolled(page)).toBe(0)
})
