/**
 * The belt of pictures (rq-ezpg.8): the carried things lie along the foot of
 * the room's picture, a press on one opens its ring, Use with… and Give… take
 * it in hand with a strip saying so, and the next press on a thing sends the
 * command typed. Cancel and Escape put it down; B goes to the belt.
 */
import { test, expect, type Page } from './fixtures'

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Open the game in the cottage with its picture up and a few things placed on it, the bread taken. */
async function toTheCottage(page: Page): Promise<void> {
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1920,
          height: 1080,
          areas: {
            hearth: { x: 0.1, y: 0.2, width: 0.15, height: 0.3 },
            bread: { x: 0.5, y: 0.3, width: 0.1, height: 0.1 },
            grandmother: { x: 0.8, y: 0.2, width: 0.1, height: 0.3 },
          },
        },
      },
    }),
  )
  await page.route('**/images/generated/*.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  // The title's opening is skipped by the suite's reduced motion; this spec needs the motion back.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('.lq-chapter-button').click()
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  await page
    .getByRole('region', { name: /^Action/ })
    .getByRole('button', { name: /^(Type|Type a command)$/ })
    .click()
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('say hello to voice')
  await input.press('Enter')
  await page.keyboard.press('Escape')
  await expect(page.locator('.lq-room-name')).toHaveText("Elior's Cottage")
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  // Only while a card is really up: one fading out takes no key, and a press
  // too many would open the folded actions.
  const goOn = page.locator(
    '.lq-arrival-card:not(.lq-arrival-fade-leave-active) .lq-arrival-hint:visible',
  )
  for (let turn = 0; turn < 8 && (await goOn.count()) > 0; turn++)
    await page.keyboard.press('Enter')
  await expect(goOn).toHaveCount(0)
  // Take the bread by its ring, then let the answer be told.
  await page.locator('[data-area-press="bread"]').focus()
  await page.keyboard.press('Enter')
  await page
    .getByRole('menu', { name: 'Bread' })
    .getByRole('menuitem', { name: /Take/ })
    .click()
  await expect(page.locator('[data-belt-pic="item:bread"]')).toBeVisible()
  for (let turn = 0; turn < 8 && (await goOn.count()) > 0; turn++)
    await page.keyboard.press('Enter')
}

test('a carried thing is used on a person from the belt: ring, hand, press', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const story = page.locator('.lq-story')
  await page.locator('[data-belt-pic="item:bread"]').click()
  const ring = page.getByRole('menu', { name: 'Bread' })
  await expect(ring).toBeVisible()
  await ring.getByRole('menuitem', { name: /Give/ }).click()
  await expect(ring).toHaveCount(0)
  const strip = page.getByRole('status').filter({ hasText: 'Give Bread to…' })
  await expect(strip).toBeVisible()
  await expect(strip.getByRole('button', { name: '✕ Cancel' })).toBeVisible()
  await page.screenshot({ path: 'test-results/belt-laptop-in-hand.png' })
  const before = (await story.innerText()).length
  await page.locator('[data-area-press="grandmother"]').click({ force: true })
  await expect(strip).toHaveCount(0)
  await expect
    .poll(async () => (await story.innerText()).length)
    .toBeGreaterThan(before)
  // The game's own answer, as typing `give bread to grandmother` gives it.
  await expect(story).toContainText('Grandmother turns it over in her hands')
})

test('Cancel and Escape put the thing down and send nothing', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const story = page.locator('.lq-story')
  const before = (await story.innerText()).length
  for (const putDown of ['cancel', 'escape']) {
    await page.locator('[data-belt-pic="item:bread"]').click()
    await page
      .getByRole('menu', { name: 'Bread' })
      .getByRole('menuitem', { name: /Use with/ })
      .click()
    const strip = page
      .getByRole('status')
      .filter({ hasText: 'Use Bread with…' })
    await expect(strip).toBeVisible()
    if (putDown === 'cancel')
      await strip.getByRole('button', { name: '✕ Cancel' }).click()
    else await page.keyboard.press('Escape')
    await expect(strip).toHaveCount(0)
  }
  expect((await story.innerText()).length).toBe(before)
})

/** The caption of the picture reached lies clear of the ▾ Hide, and the ▴ Show tab; its layer stands over the story words. */
async function expectCaptionClear(page: Page): Promise<void> {
  const caption = page.locator('.lq-belt-caption')
  await expect(caption).toBeVisible()
  // The caption is the topmost thing at its centre (hit-testable only for this check).
  expect(
    await caption.evaluate((el) => {
      el.style.pointerEvents = 'auto'
      const r = el.getBoundingClientRect()
      const top = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2,
      )
      el.style.pointerEvents = ''
      return !!top && el.contains(top)
    }),
  ).toBe(true)
  const cap = (await caption.boundingBox())!
  const hide = page.locator('.lq-words-hide, .lq-paper-tab')
  await expect(hide).toHaveCount(1)
  const pill = (await hide.boundingBox())!
  expect(cap.y + cap.height).toBeLessThanOrEqual(pill.y + 1)
}

for (const size of [
  { width: 1280, height: 800 },
  { width: 500, height: 757 },
]) {
  test(`the caption clears the Hide and the Show tab at ${size.width}x${size.height}`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize(size)
    await toTheCottage(page)
    await page.keyboard.press('b')
    await expectCaptionClear(page)
    await page.keyboard.press('Escape')
    await page.locator('.lq-words-hide').click()
    await page.keyboard.press('b')
    await expectCaptionClear(page)
  })
}

test('the caption does not lie over the buttons of a ring opened from the belt', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 500, height: 757 })
  await toTheCottage(page)
  await page.locator('[data-belt-pic="item:bread"]').click()
  await expect(page.getByRole('menu', { name: 'Bread' })).toBeVisible()
  const covered = await page.evaluate(() => {
    const caption = document.querySelector<HTMLElement>('.lq-belt-caption')
    if (!caption) return -1
    caption.style.pointerEvents = 'auto'
    const count = [...document.querySelectorAll('.lq-ring-coin')].filter(
      (coin) => {
        const r = coin.getBoundingClientRect()
        const hit = document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        )
        return !hit || !coin.contains(hit)
      },
    ).length
    caption.style.pointerEvents = ''
    return count
  })
  expect(covered).toBe(0)
})

test('B goes to the belt, the belt can be put away and is remembered across a reload', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  await page.keyboard.press('b')
  await expect(page.locator('[data-belt-pic="item:bread"]')).toBeFocused()
  await expect(page.locator('.lq-belt-caption')).toContainText('Bread')
  await expectCaptionClear(page)
  await page.getByRole('button', { name: 'Put the belt away' }).click()
  await expect(page.locator('[data-belt-pic="item:bread"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Bag' })).toBeVisible()
  const kept = await page.evaluate(() =>
    localStorage.getItem('retroquest_belt'),
  )
  expect(JSON.parse(kept ?? '{}').away).toBe(true)
})

/**
 * What a name under a picture looks like laid out: the tile's width, the lines
 * it takes, whether any word is broken across lines and whether any is cut.
 */
async function nameLayout(
  page: Page,
  name: string,
): Promise<{
  tileWidth: number
  lines: number
  brokenWords: string[]
  cut: boolean
}> {
  return page.locator('[data-belt-pic="item:bread"]').evaluate((tile, text) => {
    const label = tile.querySelector('.lq-belt-name')!
    label.textContent = text
    const node = label.firstChild!
    const tops = new Set<number>()
    const brokenWords: string[] = []
    let at = 0
    for (const word of text.split(' ')) {
      const range = document.createRange()
      range.setStart(node, at)
      range.setEnd(node, at + word.length)
      const rects = [...range.getClientRects()]
      if (rects.length !== 1) brokenWords.push(word)
      for (const rect of rects) tops.add(Math.round(rect.top))
      at += word.length + 1
    }
    return {
      tileWidth: tile.getBoundingClientRect().width,
      lines: tops.size,
      brokenWords,
      cut:
        label.scrollHeight > label.clientHeight ||
        label.scrollWidth > label.clientWidth,
    }
  }, name)
}

for (const name of ['Wandering Boots', 'Faded Photograph']) {
  test(`${name} shows whole on two lines at the belt's usual width`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await toTheCottage(page)
    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    expect(await nameLayout(page, name)).toEqual({
      tileWidth: 72,
      lines: 2,
      brokenWords: [],
      cut: false,
    })
  })
}

test.describe('on a phone held sideways', () => {
  test.use({ hasTouch: true, isMobile: true })
  test('the belt shares the foot row with the actions, with no names beneath', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 568, height: 320 })
    await toTheCottage(page)
    const pic = page.locator('[data-belt-pic="item:bread"]')
    await expect(pic).toBeVisible()
    await expect(page.locator('.lq-belt-name')).toHaveCount(0)
    await page.screenshot({ path: 'test-results/belt-sideways.png' })
    const dock = (await page.locator('.lq-dock').boundingBox())!
    const box = (await pic.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(dock.x + dock.width)
    const stage = (await page.locator('.lq-stage').boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(stage.y + stage.height + 1)
  })
})
