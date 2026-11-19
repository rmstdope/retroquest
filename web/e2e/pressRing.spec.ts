/**
 * Pressing a thing on a room's picture (rq-ezpg.6): a ring of actions opens
 * round it, an action sends the command it would have typed, Escape steps back,
 * and on the smallest sideways phone the ring stays inside the picture.
 */
import {
  test,
  expect,
  enterCommand,
  type Page,
  closeTypingBox,
  showNames,
} from './fixtures'

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Open the game in the cottage with its picture up and a few things placed on it (and `more`). */
async function toTheCottage(
  page: Page,
  breadY = 0.6,
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
            hearth: { x: 0.1, y: 0.4, width: 0.15, height: 0.3 },
            bread: { x: 0.5, y: breadY, width: 0.1, height: 0.1 },
            grandmother: { x: 0.8, y: 0.3, width: 0.1, height: 0.3 },
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
  // The dream is told a few lines at a time on a small screen.
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  // The voice wakes Elior in his cottage.
  await enterCommand(page, 'say hello to voice')
  await closeTypingBox(page)
  // The waking is told in the middle of the dark first; Enter brings the cottage up.
  await page.getByTestId('scene-interlude').waitFor()
  await page.keyboard.press('Enter')
  await expect(page.locator('.lq-name-text')).toHaveText("Elior's Cottage")
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  // The words are told first; a press while they are told only hurries them.
  // Only while a card is really up: one fading out takes no key, and a press
  // too many would open the folded actions.
  const goOn = page.locator(
    '.lq-arrival-card:not(.lq-arrival-fade-leave-active) .lq-arrival-hint:visible',
  )
  for (let turn = 0; turn < 8 && (await goOn.count()) > 0; turn++)
    await page.keyboard.press('Enter')
  await expect(goOn).toHaveCount(0)
}

/** The picture drifts, so a thing is never "stable" to the browser: press it where it is. */
async function pressThing(page: Page, id: string): Promise<void> {
  await page.locator(`[data-area-press="${id}"]`).click({ force: true })
}

test('pressing Grandmother opens a ring, and Examine sends what was typed', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  await pressThing(page, 'grandmother')
  const ring = page.getByRole('menu', { name: 'Grandmother' })
  await expect(ring).toBeVisible()
  await expect(ring.getByRole('menuitem')).toHaveCount(3)
  await ring.getByRole('menuitem', { name: /Examine/ }).click()
  await expect(ring).toHaveCount(0)
  await expect(page.locator('.lq-story')).toContainText(
    'She has raised you since your parents went away',
  )
})

test('every button of the ring can be pressed: none lies under the command bar or the words', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  // The bread lies near the foot of the picture: its ring reaches the command bar.
  await toTheCottage(page, 0.84)
  await pressThing(page, 'bread')
  await expect(page.getByRole('menu', { name: 'Bread' })).toBeVisible()
  const covered = await page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>('.lq-ring-coin')].filter(
        (coin) => {
          const r = coin.getBoundingClientRect()
          const hit = document.elementFromPoint(
            r.left + r.width / 2,
            r.top + r.height / 2,
          )
          return !hit || !coin.contains(hit)
        },
      ).length,
  )
  expect(covered).toBe(0)
})

test('Tab never reaches the things on the picture, and draws no box over it', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  await page.mouse.move(1, 1)
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(
        () =>
          document.activeElement?.classList.contains('lq-area-press-hit') ??
          false,
      ),
    ).toBe(false)
  }
  // A thing given focus some other way still draws no box round itself.
  const bread = page.locator('[data-area-press="bread"]')
  await bread.focus()
  expect(await bread.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    'none',
  )
})

test('Escape closes the ring and focus goes back to the thing', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  await page.locator('[data-area-press="bread"]').focus()
  await page.keyboard.press('Enter')
  const ring = page.getByRole('menu', { name: 'Bread' })
  await expect(ring.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(ring).toHaveCount(0)
  await expect(page.locator('[data-area-press="bread"]')).toBeFocused()
})

test('a thing pressed and stepped back from, the mouse still on it, is named once', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  await pressThing(page, 'bread')
  const ring = page.getByRole('menu', { name: 'Bread' })
  await expect(ring).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(ring).toHaveCount(0)
  await expect(page.locator('[data-area-press="bread"]')).toBeFocused()
  // Focus names nothing; the one name is the pointer's.
  await expect(page.locator('.lq-area-name')).toHaveText(['Bread'])
  await expect(page.locator('[data-area-pointer]')).toHaveCount(1)
  await expect(page.locator('.lq-area-mark')).toHaveCount(0)
})

test('Take on scenery is answered as typing it would, and a person fans out the carried things under Use with…', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const story = page.locator('.lq-story')
  const before = (await story.innerText()).length
  await pressThing(page, 'hearth')
  const ring = page.getByRole('menu', { name: 'Hearth' })
  await expect(ring.getByRole('menuitem', { name: /Use with/ })).toHaveCount(0)
  await ring.getByRole('menuitem', { name: /Take/ }).click()
  await expect(ring).toHaveCount(0)
  await expect
    .poll(async () => (await story.innerText()).length)
    .toBeGreaterThan(before)
  // Take the bread by keyboard (it lies under the words): the hearth then has Use with….
  await page.locator('[data-area-press="bread"]').focus()
  await page.keyboard.press('Enter')
  const breadRing = page.getByRole('menu', { name: 'Bread' })
  await breadRing.getByRole('menuitem', { name: /Take/ }).click()
  await expect(page.locator('[data-area-press="bread"]')).toHaveCount(0)
  // The answer is told first; presses hurry it, and once told the ring opens (not under the words).
  const person = page.getByRole('menu', { name: 'Grandmother' })
  await expect(async () => {
    await pressThing(page, 'grandmother')
    await expect(person).toBeVisible({ timeout: 1000 })
  }).toPass()
  await person.getByRole('menuitem', { name: /Use with/ }).click()
  await expect(
    person.locator('.lq-ring-fan').getByRole('menuitem', { name: 'Bread' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(person.locator('.lq-ring-fan')).toHaveCount(0)
})

test('a press on a name or mark while names are showing is a press on its thing', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  await showNames(page)
  const name = page.locator('[data-area-name="grandmother"]')
  await expect(name).toBeVisible()
  const box = (await name.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.getByRole('menu', { name: 'Grandmother' })).toBeVisible()
})

test.describe('on the smallest sideways phone', () => {
  test.use({ hasTouch: true, isMobile: true })
  test('the ring of a person fits inside the picture', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 568, height: 320 })
    await toTheCottage(page)
    await pressThing(page, 'grandmother')
    const buttons = page.locator('.lq-press-ring .lq-ring-coin')
    await expect(buttons.first()).toBeVisible()
    const stage = (await page.locator('.lq-stage').boundingBox())!
    for (const box of await buttons.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().toJSON()),
    )) {
      expect(box.left).toBeGreaterThanOrEqual(stage.x - 1)
      expect(box.top).toBeGreaterThanOrEqual(stage.y - 1)
      expect(box.right).toBeLessThanOrEqual(stage.x + stage.width + 1)
      expect(box.bottom).toBeLessThanOrEqual(stage.y + stage.height + 1)
    }
  })
})

test('a ring at the top edge shows its long name in full, on screen and clear of every button (rq-v29l.6)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1512, height: 806 })
  // The Faded Photograph hangs high on the wall, near the picture's top.
  await toTheCottage(page, 0.6, {
    'faded-photograph': { x: 0.24, y: 0.0, width: 0.06, height: 0.08 },
  })
  await enterCommand(page, 'search')
  await closeTypingBox(page)
  const photograph = page.locator('[data-area-press="faded-photograph"]')
  await expect(photograph).toHaveCount(1)
  const goOn = page.locator(
    '.lq-arrival-card:not(.lq-arrival-fade-leave-active) .lq-arrival-hint:visible',
  )
  for (let turn = 0; turn < 8 && (await goOn.count()) > 0; turn++)
    await page.keyboard.press('Enter')
  await pressThing(page, 'faded-photograph')
  await expect(
    page.getByRole('menu', { name: 'Faded Photograph' }),
  ).toBeVisible()
  const parts = await page.evaluate(() => {
    const box = (el: Element): number[] => {
      const r = el.getBoundingClientRect()
      return [r.left, r.top, r.right, r.bottom]
    }
    const name = document.querySelector('.lq-ring-name')!
    return {
      name: box(name),
      nameCut: name.scrollWidth > name.clientWidth,
      coins: [...document.querySelectorAll('.lq-ring-coin')].map(box),
      screen: [0, 0, window.innerWidth, window.innerHeight],
    }
  })
  expect(parts.nameCut).toBe(false)
  for (const part of [parts.name, ...parts.coins]) {
    expect(part[0]).toBeGreaterThanOrEqual(0)
    expect(part[1]).toBeGreaterThanOrEqual(0)
    expect(part[2]).toBeLessThanOrEqual(parts.screen[2])
    expect(part[3]).toBeLessThanOrEqual(parts.screen[3])
  }
  // A button is round: it covers the name where its circle meets the name's box.
  for (const coin of parts.coins) {
    const r = (coin[2] - coin[0]) / 2
    const c = { x: coin[0] + r, y: coin[1] + r }
    const near = {
      x: Math.max(parts.name[0], Math.min(c.x, parts.name[2])),
      y: Math.max(parts.name[1], Math.min(c.y, parts.name[3])),
    }
    expect(Math.hypot(c.x - near.x, c.y - near.y)).toBeGreaterThanOrEqual(r)
  }
})
