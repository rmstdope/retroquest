/**
 * Nothing the player needs is hidden behind another layer (rq-v29l.10): the
 * names in the picture keep clear of the "▾ Hide" that comes with new words,
 * of the "Use … with" strip and of a bag picture's caption, and an open
 * journal or quest drawer has the bag tray (and so its caption) beside it,
 * not under it.
 */
import {
  test,
  expect,
  type Page,
  skipTelling,
  showNames,
  closeTypingBox,
  enterCommand,
  sendToGame as send,
} from './fixtures'

/** A placed area, in fractions of the picture. */
interface AreaFractions {
  x: number
  y: number
  width: number
  height: number
}

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * The cottage's things on a 1280×800 window (the 16:9 picture trimmed to the
 * stage): the bread at the foot of the middle, where the "▾ Hide" stands; the
 * hearth at the top of the middle, where the "Use … with" strip stands; the
 * grandmother just above the bag tray's middle, where a bag picture's caption
 * stands.
 */
const COVERED: Record<string, AreaFractions> = {
  bread: { x: 0.48, y: 0.827, width: 0.04, height: 0.05 },
  hearth: { x: 0.45, y: 0.11, width: 0.1, height: 0.06 },
  grandmother: { x: 0.41, y: 0.835, width: 0.06, height: 0.05 },
}

/** Open the game in the cottage with its picture up and the things of `COVERED` placed on it. */
async function toTheCottage(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1512, height: 806 })
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1920,
          height: 1080,
          areas: COVERED,
        },
      },
    }),
  )
  await page.route('**/images/generated/*.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  // The title's opening is skipped by the suite's reduced motion; the change of scene needs the motion back.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('.lq-chapter-button').click()
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  await enterCommand(page, 'say hello to voice')
  await closeTypingBox(page)
  await page.getByTestId('scene-interlude').waitFor()
  await page.keyboard.press('Enter')
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  const told = page.locator('[data-testid="arrival-on-picture"].lq-on')
  await told.waitFor()
  await skipTelling(page)
  await expect(told).toHaveCount(0)
}

/** A box on the screen. */
interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Whether two boxes share any area. */
function overlap(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  )
}

/** Let the page draw `count` frames. */
async function nextFrames(page: Page, count = 2): Promise<void> {
  await page.evaluate(
    (frames) =>
      new Promise<void>((resolve) => {
        const step = (left: number): void => {
          if (left === 0) resolve()
          else requestAnimationFrame(() => step(left - 1))
        }
        step(frames)
      }),
    count,
  )
}

/** The marks and names in the picture that lie under or over the box of `selector`, by their thing. */
async function namesOver(page: Page, selector: string): Promise<string[]> {
  const cover = await page.locator(selector).boundingBox()
  if (!cover) throw new Error(`${selector} is not shown`)
  const over: string[] = []
  for (const spot of await page
    .locator('[data-area-name], [data-area-mark]')
    .all()) {
    const box = await spot.boundingBox()
    if (box && overlap(box, cover))
      over.push(
        (await spot.getAttribute('data-area-name')) ??
          `mark of ${await spot.getAttribute('data-area-mark')}`,
      )
  }
  return over
}

test('a name already up moves clear of the Hide that new words bring', async ({
  page,
}): Promise<void> => {
  await toTheCottage(page)
  // Words have been told and have faded, and their Hide with them.
  await send(page, 'look')
  await expect(page.locator('.lq-words-hide')).toBeVisible()
  await expect(page.locator('.lq-words-hide')).toHaveCount(0, {
    timeout: 30_000,
  })
  await showNames(page)
  await expect(page.locator('[data-area-name="bread"]')).toBeVisible()
  // New words come while the names are up, and the Hide with them.
  await send(page, 'look')
  await expect(page.locator('.lq-words-hide')).toBeVisible()
  // At once: a scroll of the story may measure again later, but the Hide is never to cover a name meanwhile.
  await nextFrames(page)
  expect(await namesOver(page, '.lq-words-hide')).toEqual([])
})

test('no name lies under the "Use … with" strip', async ({
  page,
}): Promise<void> => {
  await toTheCottage(page)
  await send(page, 'use lantern')
  await send(page, 'take bread')
  await expect(page.locator('[data-belt-pic="item:bread"]')).toBeVisible()
  // The bread's own name has left the picture with it (it fades out where it stood).
  await expect(page.locator('[data-area-name="bread"]')).toHaveCount(0)
  // The answer is told first: a press on the bag then would hurry it.
  await skipTelling(page)
  await page.locator('[data-belt-pic="item:bread"]').click()
  await page
    .getByRole('menu', { name: 'Bread' })
    .getByRole('menuitem', { name: /Use with/ })
    .click()
  await expect(page.locator('.lq-hand-strip')).toBeVisible()
  await showNames(page)
  await expect(page.locator('[data-area-name="hearth"]')).toBeVisible()
  await expect
    .poll(() => namesOver(page, '.lq-hand-strip'), { timeout: 2_000 })
    .toEqual([])
})

test("no name lies over a bag picture's caption", async ({
  page,
}): Promise<void> => {
  await toTheCottage(page)
  await send(page, 'use lantern')
  await send(page, 'take bread')
  await expect(page.locator('[data-belt-pic="item:bread"]')).toBeVisible()
  // The bread's own name has left the picture with it (it fades out where it stood).
  await expect(page.locator('[data-area-name="bread"]')).toHaveCount(0)
  await showNames(page)
  await expect(page.locator('[data-area-name="grandmother"]')).toBeVisible()
  await page.locator('[data-belt-pic="item:bread"]').hover()
  await expect(page.locator('.lq-belt-caption')).toBeVisible()
  await expect
    .poll(() => namesOver(page, '.lq-belt-caption'), { timeout: 2_000 })
    .toEqual([])
})

for (const [key, drawer] of [
  ['j', '.lq-story-drawer'],
  ['q', '.lq-drawer'],
] as const)
  test(`the bag tray stops short of the open drawer (${key})`, async ({
    page,
  }): Promise<void> => {
    await toTheCottage(page)
    await page.keyboard.press(key)
    const open = await page.locator(drawer).boundingBox()
    const tray = await page.locator('.lq-belt').boundingBox()
    expect(tray!.x + tray!.width).toBeLessThanOrEqual(open!.x)
  })

test("a bag picture's caption moves beside a journal opened under it", async ({
  page,
}): Promise<void> => {
  await toTheCottage(page)
  await send(page, 'use lantern')
  // The lantern's caption is a long one.
  await send(page, 'take lantern')
  await page.getByRole('button', { name: 'Lantern (lit)' }).hover()
  await expect(page.locator('.lq-belt-caption')).toBeVisible()
  await page.keyboard.press('j')
  await expect(page.locator('.lq-story-drawer')).toBeVisible()
  await nextFrames(page, 3)
  const caption = await page.locator('.lq-belt-caption').boundingBox()
  // The journal takes the right half of the window once it has slid in.
  expect(caption!.x + caption!.width).toBeLessThanOrEqual(1512 / 2)
})
