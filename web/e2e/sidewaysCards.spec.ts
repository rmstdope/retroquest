/**
 * The cards told on the picture of a phone held sideways (rq-dpom): they use
 * the free height between the top and bottom rows, the smallest phones take
 * smaller type, the seal stands beside the heading and the pill says "Tap to
 * continue".
 */
import { test, expect, type Page } from '@playwright/test'

/** A touch screen, as a phone reports itself. */
test.use({ hasTouch: true, isMobile: true })

const NEW_QUEST = {
  kind: 'new',
  name: 'Curiosity killed the cat',
  main: false,
  text:
    'A cat has been seen slipping into the abandoned shed at night. ' +
    'Mira would like to know what it finds there. ' +
    'Look around the shed and see what draws it in.',
}
/** The real one-sentence line of Curiosity killed the cat: it cannot be cut between sentences. */
const CURIOSITY = {
  ...NEW_QUEST,
  text:
    'The small patchwork shape hiding in the Abandoned Shed looked a lot ' +
    'like Patches, the cat who sleeps on the counter of the General Store.',
}
const DONE_QUEST = {
  kind: 'completed',
  name: 'Hint of magic',
  main: false,
  text: 'It stayed.',
  progress: { completed: 3, total: 11 },
}

/** Open the game at this size and close the opening chapter page and the first arrival. */
async function start(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  // The title's opening is skipped by the suite's reduced motion; this spec needs the motion back.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('.lq-chapter-button').click()
  await page.getByTestId('arrival-on-picture').click()
}

/** Push a turn with quest news, as the engine reports them. */
async function pushNews(page: Page, quests: unknown[]): Promise<void> {
  await page.evaluate((quests) => {
    const app = (
      document.querySelector('#app') as unknown as {
        __vue_app__: {
          config: {
            globalProperties: {
              $pinia: { state: { value: { game: { turns: unknown[] } } } }
            }
          }
        }
      }
    ).__vue_app__
    app.config.globalProperties.$pinia.state.value.game.turns.push({
      id: 998,
      command: 'talk to grandmother',
      text: 'She smiles.',
      room: 'Cottage',
      description: null,
      gained: [],
      lost: [],
      arrival: null,
      quests,
    })
  }, quests)
}

const stage = (page: Page) => page.getByTestId('arrival-on-picture')

/** The computed font size (px) of the first match. */
const fontSize = (page: Page, selector: string): Promise<string> =>
  stage(page)
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).fontSize)

test('the smallest phone: smaller type, whole lines, clear of both rows', async ({
  page,
}) => {
  await start(page, 568, 320)
  await pushNews(page, [NEW_QUEST])
  await expect(stage(page).locator('.lq-arrival-card')).toHaveCount(1)
  await expect(stage(page).locator('.lq-arrival-hint').last()).toHaveText(
    'Tap to continue',
  )
  expect(await fontSize(page, '.lq-arrival-line')).toBe('17px')
  // 30 px, scaled by the display scale of a narrow screen.
  const title = parseFloat(await fontSize(page, '.lq-news-name'))
  expect(title).toBeGreaterThan(24)
  expect(title).toBeLessThanOrEqual(30)
  const text = stage(page).locator('.lq-arrival-text')
  expect(
    await text.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
  ).toBe(true)
  const box = await stage(page).boundingBox()
  const head = await stage(page).locator('.lq-news-top').boundingBox()
  const pill = await stage(page).locator('.lq-arrival-pill').boundingBox()
  expect(head!.y).toBeGreaterThanOrEqual(box!.y + 56)
  expect(pill!.y + pill!.height).toBeLessThanOrEqual(box!.y + box!.height - 61)
})

test('a larger phone keeps today’s type', async ({ page }) => {
  await start(page, 844, 390)
  await pushNews(page, [NEW_QUEST])
  await expect(stage(page).locator('.lq-news-name').first()).toBeVisible()
  expect(await fontSize(page, '.lq-arrival-line')).toBe('24px')
  // 44 px, scaled by the display scale of a narrow screen.
  expect(parseFloat(await fontSize(page, '.lq-news-name'))).toBeGreaterThan(36)
})

test('a finished quest has a small tick beside its heading', async ({
  page,
}) => {
  await start(page, 568, 320)
  await pushNews(page, [DONE_QUEST])
  const seal = stage(page).locator('.lq-news-seal')
  await expect(seal).toBeVisible()
  const sealBox = await seal.boundingBox()
  const kicker = await stage(page).locator('.lq-news-kicker').boundingBox()
  expect(sealBox!.width).toBe(22)
  expect(sealBox!.height).toBe(22)
  expect(sealBox!.x + sealBox!.width).toBeLessThanOrEqual(kicker!.x)
  const sealMid = sealBox!.y + sealBox!.height / 2
  const kickerMid = kicker!.y + kicker!.height / 2
  expect(Math.abs(sealMid - kickerMid)).toBeLessThanOrEqual(2)
})

/** The picture's bottom edge (the foot) and the belt of pictures' box. */
async function beltGeometry(page: Page) {
  const foot = await stage(page).boundingBox()
  const belt = await page.locator('section.lq-belt').boundingBox()
  const bag = await page.locator('[data-belt-switch="bag"]').boundingBox()
  const spells = await page.locator('[data-belt-switch="spells"]').boundingBox()
  return {
    foot: foot!.y + foot!.height,
    belt: belt!,
    bag: bag!,
    spells: spells!,
  }
}

for (const [width, height] of [
  [568, 320],
  [640, 360],
  [667, 375],
]) {
  test(`${width}x${height}: the slim row lets a three-line card stay whole`, async ({
    page,
  }) => {
    await start(page, width, height)
    await pushNews(page, [CURIOSITY])
    await expect(stage(page).locator('.lq-arrival-card')).toHaveCount(1)
    const { foot, belt, bag, spells } = await beltGeometry(page)
    // Only as tall as its pictures; its top lies 60 px above the foot.
    expect(belt.height).toBe(52)
    expect(Math.round(foot - belt.y)).toBe(60)
    // Pouch and star side by side, level.
    expect(bag.y).toBeCloseTo(spells.y, 0)
    expect(spells.x).toBeGreaterThan(bag.x + bag.width)
    const text = stage(page).locator('.lq-arrival-text')
    expect(
      await text.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
    ).toBe(true)
    const pill = await stage(page).locator('.lq-arrival-pill').boundingBox()
    expect(pill!.y + pill!.height).toBeLessThanOrEqual(foot - 61)
  })
}

test('folded away the pouch and star stack again', async ({ page }) => {
  await start(page, 568, 320)
  await page.getByRole('button', { name: 'Put the belt away' }).click()
  const { bag, spells } = await beltGeometry(page)
  expect(bag.x).toBeCloseTo(spells.x, 0)
  expect(spells.y).toBeGreaterThan(bag.y + bag.height)
})

/** The real finished Fishing expedition card: one sentence of three lines at 640x360 (rq-z0hc). */
const FISHING = {
  kind: 'completed',
  name: 'Fishing expedition',
  main: false,
  text:
    'You brought the fisherman a fish, and he gave you back something of ' +
    'your mother’s: the spell she taught him at the bend.',
  progress: { completed: 3, total: 11 },
}

test('a finished quest of three lines reads whole at 640x360', async ({
  page,
}) => {
  await start(page, 640, 360)
  await pushNews(page, [FISHING])
  const text = stage(page)
    .locator('.lq-arrival-card', { has: page.locator('.lq-news-head') })
    .locator('.lq-arrival-text')
  await expect(text).toBeVisible()
  await expect(text).not.toHaveClass(/lq-fade/)
  expect(await text.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(
    true,
  )
})
