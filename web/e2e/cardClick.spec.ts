/**
 * The click that goes on a card told over the room's picture is the card's
 * (rq-r6xn), even when the card goes by itself just as the player clicks: the
 * click must not open the ring of a thing whose mark showed through the card
 * under the pointer.
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

/** Open the game in the cottage with its picture up, Grandmother in the middle of it, and its words and quest news gone. */
async function toTheCottage(page: Page): Promise<void> {
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1920,
          height: 1080,
          areas: {
            grandmother: { x: 0.3, y: 0.2, width: 0.4, height: 0.5 },
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
  // The title's opening is skipped by the suite's reduced motion; the waking needs the motion back.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('.lq-chapter-button').click()
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  await enterCommand(page, 'say hello to voice')
  await closeTypingBox(page)
  await page.getByTestId('scene-interlude').waitFor()
  await page.keyboard.press('Enter')
  await expect(page.locator('.lq-name-text')).toHaveText("Elior's Cottage")
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  // Only while a card is really up: one fading out takes no key.
  const goOn = page.locator(
    '.lq-arrival-card:not(.lq-arrival-fade-leave-active) .lq-arrival-hint:visible',
  )
  for (let turn = 0; turn < 8 && (await goOn.count()) > 0; turn++)
    await page.keyboard.press('Enter')
  await expect(goOn).toHaveCount(0)
}

/** Push a turn with one piece of quest news, as the engine reports it: a card told over the picture. */
async function pushNews(page: Page): Promise<void> {
  await page.evaluate(() => {
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
      room: "Elior's Cottage",
      description: null,
      gained: [],
      lost: [],
      arrival: null,
      quests: [
        { kind: 'new', name: 'Magic for real', main: false, text: 'Go on.' },
      ],
    })
  })
}

test('a click on a card just as it goes by itself opens no ring on the thing under it', async ({
  page,
}): Promise<void> => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  await pushNews(page)
  await expect(page.locator('.lq-arrival-stage.lq-on')).toHaveCount(1)
  // A key now and then keeps the marks up while the card is read: Grandmother's shows through it.
  const keys = await page.evaluateHandle(() =>
    setInterval(
      () =>
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' })),
      500,
    ),
  )
  const mark = page.locator('[data-area-mark="grandmother"]')
  // Its place once the card has made room for it: it comes in at its own
  // place, steps aside for the card, and then holds, give or take the
  // picture's slow drift.
  const first = await mark.boundingBox()
  if (!first) throw new Error('Grandmother has no mark')
  let spot: typeof first | null = first
  await expect
    .poll(
      async () => {
        const before = spot
        spot = await mark.boundingBox()
        if (!before || !spot) return false
        const aside = Math.hypot(spot.x - first.x, spot.y - first.y) > 10
        return aside && Math.hypot(spot.x - before.x, spot.y - before.y) < 2
      },
      { intervals: [100] },
    )
    .toBe(true)
  if (!spot) throw new Error('Grandmother has no mark')
  const x = spot.x + spot.width / 2
  const y = spot.y + spot.height / 2
  // The pointer rests on the card, just off the mark the click will land on.
  await page.mouse.move(x + 3, y + 3)
  // Whether the card's linger still held when the press went down.
  await page.evaluate(() => {
    const root = document.querySelector('#app') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $pinia: { _s: Map<string, { lingering?: boolean }> }
          }
        }
      }
    }
    const arrival =
      root.__vue_app__.config.globalProperties.$pinia._s.get('arrival')
    document.addEventListener(
      'pointerdown',
      () => {
        document.body.dataset.lingered = String(!!arrival?.lingering)
      },
      { capture: true, once: true },
    )
  })
  // The card is read for its time and goes by itself; the player clicks it at that moment.
  await page.waitForFunction(
    () => document.querySelectorAll('.lq-arrival-stage.lq-on').length === 0,
    null,
    { timeout: 30_000, polling: 'raf' },
  )
  await page.mouse.click(x, y)
  await page.evaluate((id) => clearInterval(id), keys)
  // A click that came after the linger tests nothing: the setup was too slow, not the game wrong.
  await expect(
    page.locator('body'),
    'the click came within the linger',
  ).toHaveAttribute('data-lingered', 'true')
  // The ring would open on the click itself; one frame later there is none.
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => done(null))),
  )
  await expect(page.getByRole('menu')).toHaveCount(0)
})
