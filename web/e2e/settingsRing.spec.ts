/**
 * The cream ring in Settings is always drawn whole: when the arrows, a wrap
 * round, Tab, the mouse or a tap bring a row to either end of the scrolling list, the list
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

test('Settings: the ring stays whole on the last row when the music arrives late', async ({
  page,
}): Promise<void> => {
  // Hold the music back, as a slow machine does, so its "Now playing" line
  // shows up above the Playing rows only after the ring has reached them.
  let release = (): void => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/audio/music/**', async (route) => {
    await held
    await route.continue()
  })
  await openSettings(page)
  await expect(page.locator('.lq-now-playing')).toHaveCount(0)
  await page.keyboard.press('ArrowUp')
  await expect.poll(() => ringed(page)).toBe('alwaysShowNames')
  await expect.poll(() => clipped(page)).toBe('0')
  release()
  await expect(page.locator('.lq-now-playing')).toBeVisible()
  await expect.poll(() => clipped(page)).toBe('0')
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

/** The name of the row holding the ring (its `data-stop`). */
async function ringed(page: Page): Promise<string | null | undefined> {
  return page.evaluate(() =>
    document.activeElement?.closest('[data-stop]')?.getAttribute('data-stop'),
  )
}

/** Move the mouse onto a point in two steps, so it really moves. */
async function pointAt(
  page: Page,
  at: { x: number; y: number },
): Promise<void> {
  // Leave the dialog first: pointing at a row means arriving on it.
  await page.mouse.move(5, 5)
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
  expect(await ringed(page)).toBe('musicVolume')
  await pointAt(page, await cutRow(page, 'head', 26))
  await expect.poll(() => clipped(page)).toBe('0')
  expect(await ringed(page)).toBe('musicVolume')
})

test('Settings: a mouse on a sliver of a row brings the whole row in', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  await pointAt(page, await cutRow(page, 'foot', 4))
  await expect.poll(() => clipped(page)).toBe('0')
  expect(await ringed(page)).toBe('musicVolume')
  await pointAt(page, await cutRow(page, 'head', 4))
  await expect.poll(() => clipped(page)).toBe('0')
})

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('Settings: a tap on a row half hidden at the foot brings the ring whole', async ({
    page,
  }): Promise<void> => {
    await openSettings(page, 844)
    const at = await cutRow(page, 'foot', 26)
    await page.touchscreen.tap(at.x, at.y)
    await expect
      .poll(() =>
        page.evaluate(() => {
          const list = document.querySelector('.lq-dialog-content')
          const row = document.querySelector('[data-stop="musicVolume"]')
          if (!list || !row) return 'missing'
          const l = list.getBoundingClientRect()
          const r = row.getBoundingClientRect()
          return r.top >= l.top && r.bottom <= l.bottom
            ? 'whole'
            : `row ${r.top}-${r.bottom} list ${l.top}-${l.bottom}`
        }),
      )
      .toBe('whole')
  })
})

test('Settings: scrolling by hand does not nudge back', async ({
  page,
}): Promise<void> => {
  await openSettings(page)
  await pointAt(page, await cutRow(page, 'foot', 26))
  await expect.poll(() => clipped(page)).toBe('0')
  await page.mouse.wheel(0, -2000)
  await expect.poll(() => scrolled(page)).toBe(0)
  // A small move inside the row under the resting mouse must not scroll either.
  await page.mouse.move(450, 300)
  await page.mouse.move(452, 300)
  expect(await scrolled(page)).toBe(0)
})
