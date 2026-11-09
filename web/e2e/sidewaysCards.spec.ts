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
