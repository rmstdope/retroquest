/**
 * The belt of pictures (rq-ezpg.8): the carried things lie along the foot of
 * the room's picture, a press on one opens its ring, Use with… takes
 * it in hand with a strip saying so, and the next press on a thing sends the
 * command typed. Cancel and Escape put it down; B goes to the belt.
 */
import {
  test,
  expect,
  enterCommand,
  type Page,
  closeTypingBox,
} from './fixtures'

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Open the game in the cottage with its picture up and a few things placed on it (and `more`), the bread taken. */
async function toTheCottage(
  page: Page,
  more: Record<string, object> = {},
): Promise<void> {
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
            ...more,
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
  await enterCommand(page, 'say hello to voice')
  await closeTypingBox(page)
  // The waking is told in the middle of the dark first; Enter brings the cottage up.
  await page.getByTestId('scene-interlude').waitFor()
  await page.keyboard.press('Enter')
  await expect(page.locator('.lq-name-text')).toHaveText("Elior's Cottage")
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
  await ring.getByRole('menuitem', { name: /Use with/ }).click()
  await expect(ring).toHaveCount(0)
  const strip = page.getByRole('status').filter({ hasText: 'Use Bread with…' })
  await expect(strip).toBeVisible()
  await expect(strip.getByRole('button', { name: '✕ Cancel' })).toBeVisible()
  await page.screenshot({ path: 'test-results/belt-laptop-in-hand.png' })
  const before = (await story.innerText()).length
  await page.locator('[data-area-press="grandmother"]').click({ force: true })
  await expect(strip).toHaveCount(0)
  await expect
    .poll(async () => (await story.innerText()).length)
    .toBeGreaterThan(before)
  // The game's own answer, as typing `use bread with grandmother` gives it.
  await expect(story).toContainText('Grandmother turns it over in her hands')
})

test('a press on the belt opens no ring of a thing lying under it, and a press on a picture opens its own (rq-v29l.5)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1512, height: 806 })
  // As the Riverbank's reeds: a thing across the picture's foot-left corner, its mark low on it.
  await toTheCottage(page, {
    hearth: {
      x: 0,
      y: 0.575926,
      width: 0.300521,
      height: 0.424074,
      mark: { x: 0.067708, y: 0.781481 },
    },
  })
  const bread = page.locator('[data-belt-pic="item:bread"]')
  const pocket = await bread.boundingBox()
  if (!pocket) throw new Error('the bread has no picture on the belt')
  // The leather just under the pocket and just beside it, where a press meant for the bread lands as often as not.
  for (const at of [
    { x: pocket.x + pocket.width / 2, y: pocket.y + pocket.height + 4 },
    { x: pocket.x + pocket.width + 3, y: pocket.y + pocket.height / 2 },
  ]) {
    await page.mouse.click(at.x, at.y)
    await expect(page.getByRole('menu', { name: 'Hearth' })).toHaveCount(0)
    // A pocket still swelling from the bread's landing may take the press itself: put its ring away.
    if ((await page.getByRole('menu').count()) > 0) {
      await page.keyboard.press('Escape')
      await expect(page.getByRole('menu')).toHaveCount(0)
    }
  }
  await bread.click()
  await expect(page.getByRole('menu', { name: 'Bread' })).toBeVisible()
  await expect(page.getByRole('menu')).toHaveCount(1)
})

test('the No match line of the typing box lies over the belt, not under its labels (rq-su6c)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  // A full bag, so the belt's pictures and their names run under the typing box.
  await page.evaluate(() => {
    type Root = {
      __vue_app__: {
        config: {
          globalProperties: {
            $pinia: { state: { value: { game: { rawInventory: unknown } } } }
          }
        }
      }
    }
    const app = (document.querySelector('#app') as unknown as Root).__vue_app__
    const store = app.config.globalProperties.$pinia.state.value.game
    store.rawInventory = [
      'Bread',
      'Rusty Hoe',
      'Egg',
      'Feather',
      'Lantern',
      'Rope',
      'Old Key',
      'Herbs',
      'Candle',
      'Coin',
    ].map((name) => ({ name, description: `A ${name}.` }))
  })
  await expect(page.locator('[data-belt-pic]')).toHaveCount(10)
  await page.keyboard.press('F1')
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('xyzzy')
  const none = page.getByRole('option', { name: 'No match for “xyzzy”' })
  await expect(none).toBeVisible()
  // Wherever a picture of the belt lies under the line, the line is what a look there meets.
  const covered = await none.evaluate((el) => {
    const line = el.getBoundingClientRect()
    const under: string[] = []
    for (const pic of document.querySelectorAll('[data-belt-pic]')) {
      const box = pic.getBoundingClientRect()
      const left = Math.max(line.left, box.left)
      const right = Math.min(line.right, box.right)
      const top = Math.max(line.top, box.top)
      const bottom = Math.min(line.bottom, box.bottom)
      if (left >= right || top >= bottom) continue
      const hit = document.elementFromPoint(
        (left + right) / 2,
        (top + bottom) / 2,
      )
      under.push(
        `${pic.getAttribute('data-belt-pic')}:${hit !== null && el.contains(hit)}`,
      )
    }
    return under
  })
  expect(
    covered.length,
    'pictures of the belt lie under the line',
  ).toBeGreaterThan(0)
  expect(covered.filter((entry) => entry.endsWith(':false'))).toEqual([])
})

for (const width of [390, 500]) {
  test(`at ${width}px the No match line shows the whole word typed, over the belt (rq-6ga3)`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: 757 })
    await toTheCottage(page)
    await page.keyboard.press('F1')
    const input = page.getByLabel('Command', { exact: true })
    await input.fill('quests')
    const none = page.getByRole('option', { name: 'No match for “quests”' })
    await expect(none).toBeVisible()
    // Nothing of the line is cut off: its text fits the box it is drawn in.
    const clipped = await none.evaluate(
      (el) =>
        el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight,
    )
    expect(clipped, 'the line is cut off').toBe(false)
    // And it is still what a look at its middle meets, not the belt below.
    const onTop = await none.evaluate((el) => {
      const box = el.getBoundingClientRect()
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      )
      return hit !== null && el.contains(hit)
    })
    expect(onTop, 'the line is on top').toBe(true)
  })
}

test('at 390px the word list spans the typing box and No match takes at most two lines (rq-ttg0)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 757 })
  await toTheCottage(page)
  await page.keyboard.press('F1')
  await page.getByLabel('Command', { exact: true }).fill('quests')
  const none = page.getByRole('option', { name: 'No match for “quests”' })
  await expect(none).toBeVisible()
  const list = page.getByRole('listbox', { name: 'Matching words' })
  const box = page.getByRole('form', { name: 'Typing box' })
  const listBox = await list.boundingBox()
  const formBox = await box.boundingBox()
  if (!listBox || !formBox) throw new Error('list or box not drawn')
  expect(Math.abs(listBox.x - formBox.x)).toBeLessThanOrEqual(2)
  expect(Math.abs(listBox.width - formBox.width)).toBeLessThanOrEqual(2) // the box border
  // Two 20px lines and 10px padding above and below.
  const lineBox = await none.boundingBox()
  expect(lineBox?.height ?? 999).toBeLessThanOrEqual(60)
})

test('at 1280px the word list stays as wide as the text field, narrower than the box (rq-ttg0)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 757 })
  await toTheCottage(page)
  await page.keyboard.press('F1')
  await page.getByLabel('Command', { exact: true }).fill('quests')
  const list = page.getByRole('listbox', { name: 'Matching words' })
  await expect(list).toBeVisible()
  const listBox = await list.boundingBox()
  const formBox = await page
    .getByRole('form', { name: 'Typing box' })
    .boundingBox()
  if (!listBox || !formBox) throw new Error('list or box not drawn')
  expect(listBox.width).toBeLessThan(formBox.width - 20)
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
  await expect(
    page.getByRole('button', { name: 'Put the belt away' }),
  ).toHaveCount(0)
  // The lit stud folds the strap away into its tab.
  await page.locator('[data-belt-switch="bag"]').click()
  await expect(page.locator('[data-belt-pic="item:bread"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Bag' })).toBeVisible()
  const kept = await page.evaluate(() =>
    localStorage.getItem('retroquest_belt'),
  )
  expect(JSON.parse(kept ?? '{}').away).toBe(true)
})

test.describe('on a phone held sideways', () => {
  test.use({ hasTouch: true, isMobile: true })
  test('the belt stands at the picture foot from its left edge, with no names beneath', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 568, height: 320 })
    await toTheCottage(page)
    const pic = page.locator('[data-belt-pic="item:bread"]')
    await expect(pic).toBeVisible()
    await expect(page.locator('.lq-belt-name')).toHaveCount(0)
    await page.screenshot({ path: 'test-results/belt-sideways.png' })
    const box = (await pic.boundingBox())!
    const stage = (await page.locator('.lq-stage').boundingBox())!
    expect(await page.locator('.lq-dock').count()).toBe(0)
    expect(box.x).toBeGreaterThanOrEqual(stage.x)
    expect(box.y + box.height).toBeLessThanOrEqual(stage.y + stage.height + 1)
  })
})

test('a thing whose picture has been made shows it in place of its letter', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const bread = page.locator('[data-belt-pic="item:bread"]')
  // The suite answers every picture file with a picture, as if the studio had made them all.
  await expect(bread.locator('img')).toHaveAttribute(
    'src',
    /images\/generated\/item-bread\.png$/,
  )
  await expect(bread.locator('.lq-belt-letter')).toHaveCount(0)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`an empty list is tooled into the leather, the same in both themes (${colorScheme})`, async ({
    page,
  }): Promise<void> => {
    await page.emulateMedia({ colorScheme })
    await page.setViewportSize({ width: 1280, height: 800 })
    await toTheCottage(page)
    await page.getByRole('button', { name: 'Spells' }).click()
    await expect(page.locator('.lq-belt-pic')).toHaveCount(0)
    const empty = page.locator('.lq-belt-empty')
    await expect(empty).toHaveText('You know no spells yet.')
    // The leather and the lettering on it are fixed, so a bright painting cannot wash them out.
    const style = await empty.evaluate((el) => {
      const computed = getComputedStyle(el)
      const bar = getComputedStyle(el.closest('.lq-belt-bar')!)
      return {
        colour: computed.color,
        italic: computed.fontStyle,
        leather: bar.backgroundImage,
      }
    })
    expect(style.colour).toBe('rgb(240, 217, 168)')
    expect(style.italic).toBe('italic')
    expect(style.leather).toContain('linear-gradient')
  })
}
