/**
 * Pressing a thing on a room's picture (rq-ezpg.6): a ring of actions opens
 * round it, an action sends the command it would have typed, Escape steps back,
 * and on the smallest sideways phone the ring stays inside the picture.
 */
import { test, expect, type Page } from './fixtures'

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Open the game in the cottage with its picture up and a few things placed on it. */
async function toTheCottage(page: Page, breadY = 0.6): Promise<void> {
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
  await page
    .getByRole('region', { name: /^Action/ })
    .getByRole('button', { name: /^(Type|Type a command)$/ })
    .click()
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('say hello to voice')
  await input.press('Enter')
  await page.keyboard.press('Escape')
  // The waking is told in the middle of the dark first; Enter brings the cottage up.
  await page.getByTestId('scene-interlude').waitFor()
  await page.keyboard.press('Enter')
  await expect(page.locator('.lq-room-name')).toHaveText("Elior's Cottage")
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
  await expect(page.locator('.lq-area-name')).toHaveText(['Bread'])
  await expect(page.locator('[data-area-pointer]')).toHaveCount(0)
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
  await expect(
    page.getByRole('button', { name: /Show what's here/ }),
  ).toBeFocused()
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
  await page.getByRole('button', { name: /Show what's here/ }).click()
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
