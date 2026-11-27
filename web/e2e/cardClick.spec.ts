/**
 * Whose click is it, when a story card told over the room's picture leaves by
 * itself (rq-ir2c)? A card under the mouse waits, so a click aimed at it lands
 * on it; once it has gone, a click does what it lands on, at once.
 */
import { test, expect, type Page, toTheCottage, withMotion } from './fixtures'

/** Stand in the cottage with Grandmother in the middle of its picture. */
async function toGrandmother(page: Page): Promise<void> {
  await toTheCottage(page, {
    areas: { grandmother: { x: 0.3, y: 0.2, width: 0.4, height: 0.5 } },
  })
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

test('a card waits under the mouse, and the click right after it has gone opens the ring on the thing there', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  // The card's reading time is stepped through on the page's clock.
  await page.clock.install()
  await toGrandmother(page)
  // The card fades as it leaves: motion.
  await withMotion(page)
  // The mouse rests in the middle of the picture, where the card comes up under it.
  await page.mouse.move(640, 360)
  await pushNews(page)
  const layer = page.locator('.lq-arrival-stage.lq-on')
  const bar = page.locator('.lq-arrival-bar i')
  await expect(layer).toHaveCount(1)
  await expect(bar).toHaveCSS('animation-play-state', 'paused')
  // Far past its reading time (6 s) it is still there.
  await page.clock.runFor(30_000)
  await expect(layer).toHaveCount(1)
  // Off the card, on the picture beside it, its time runs on and it leaves.
  await page.mouse.move(60, 400)
  await expect(bar).toHaveCSS('animation-play-state', 'running')
  await page.clock.runFor(7_000)
  await expect(layer).toHaveCount(0)
  const thing = await page
    .locator('[data-area-press="grandmother"]')
    .boundingBox()
  if (!thing) throw new Error('Grandmother cannot be pressed')
  await page.mouse.click(thing.x + thing.width / 2, thing.y + thing.height / 2)
  await expect(page.getByRole('menu')).toBeVisible()
})
