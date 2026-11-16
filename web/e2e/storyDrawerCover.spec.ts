/**
 * The open drawers of the stage (rq-q3x4): nothing from the stage is drawn
 * over them. On a tall screen (a phone-sized window, 390 × 844) the Story so
 * far drawer covers the whole stage, so the belt of pictures, the Hide / Show
 * what's here buttons, the folded Actions bar and the room's title must all lie
 * under it; on a laptop neither it nor the Quests drawer has the belt or
 * Hide / Show what's here over its foot.
 */
import { test, expect, type Page } from './fixtures'

interface VueHost {
  __vue_app__: {
    config: {
      globalProperties: {
        $pinia: { state: { value: { game: Record<string, unknown> } } }
      }
    }
  }
}

/** Open the real game past its title page with the command box ready. */
async function openGame(page: Page): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => {
    const app = (document.querySelector('#app') as unknown as VueHost)
      .__vue_app__
    return app && !app.config.globalProperties.$pinia.state.value.game.loading
  })
  await page.evaluate(() => {
    const app = (document.querySelector('#app') as unknown as VueHost)
      .__vue_app__
    const store = app.config.globalProperties.$pinia.state.value.game
    store.showTitle = false
    store.showModal = false
    store.modalChapter = null
    store.modalQuest = null
    store.modalQueue = []
    store.acceptInput = true
  })
}

/** Type `text` in the command box (opening the folded actions first when they are folded) and send it. */
async function command(page: Page, text: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  if (!(await input.isVisible()))
    await page
      .getByRole('button', { name: /^(Type|Type a command)$/ })
      .first()
      .click()
  await input.fill(text)
  await input.press('Enter')
}

/**
 * The elements drawn on top at points spread over the open drawer named by
 * `selector` that do not belong to the drawer (described by tag and class).
 */
async function coveringDrawer(page: Page, selector: string): Promise<string[]> {
  return page.evaluate((selector) => {
    const drawer = document.querySelector(selector)
    if (!drawer) return ['no drawer']
    const box = drawer.getBoundingClientRect()
    const found = new Set<string>()
    for (let y = box.top + 4; y < box.bottom - 4; y += 12)
      for (let x = box.left + 4; x < box.right - 4; x += 12) {
        const hit = document.elementFromPoint(x, y)
        if (hit && !drawer.contains(hit))
          found.add(
            `${hit.tagName.toLowerCase()}.${[...hit.classList].join('.')}`,
          )
      }
    return [...found]
  }, selector)
}

/** Play a few turns, so the story has lines and the words are up. */
async function playTurns(page: Page): Promise<void> {
  await command(page, 'look')
  await command(page, 'look')
}

/** Press the stage button named `button` and wait for the drawer called `name` to finish sliding in. */
async function openDrawer(
  page: Page,
  button: RegExp,
  name: string,
): Promise<void> {
  await page.getByRole('button', { name: button }).first().click()
  const drawer = page.getByRole('complementary', { name })
  await expect(drawer).toBeVisible()
  await expect
    .poll(() => drawer.evaluate((el) => getComputedStyle(el).transform))
    .toBe('none')
}

for (const size of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`at ${size.width}×${size.height} nothing from the stage covers the open Story so far drawer`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize(size)
    await openGame(page)
    await playTurns(page)
    await openDrawer(page, /Story so far/, 'Story so far drawer')
    expect(await coveringDrawer(page, '.lq-story-drawer')).toEqual([])
  })
}

test('at 1280×800 nothing from the stage covers the open Quests drawer', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await openGame(page)
  await playTurns(page)
  await openDrawer(page, /^Quests/, 'Journal drawer')
  expect(await coveringDrawer(page, '.lq-drawer')).toEqual([])
})
