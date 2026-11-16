/**
 * The open Story so far drawer (rq-q3x4): nothing from the stage is drawn over
 * it. On a tall screen (a phone-sized window, 390 × 844) the drawer covers the
 * whole stage, so the belt of pictures, the Hide / Show what's here buttons,
 * the folded Actions bar and the room's title must all lie under it; on a
 * laptop the belt must not lie over its foot.
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
 * The elements drawn on top at points spread over the drawer's open area that
 * do not belong to the drawer (described by tag and class).
 */
async function coveringDrawer(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const drawer = document.querySelector('.lq-story-drawer')
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
  })
}

/** Play a few turns, so the story has lines and the words are up, and open the Story so far drawer. */
async function openDrawerAfterPlaying(page: Page): Promise<void> {
  await command(page, 'look')
  await command(page, 'look')
  await page
    .getByRole('button', { name: /Story so far/ })
    .first()
    .click()
  const drawer = page.getByRole('complementary', {
    name: 'Story so far drawer',
  })
  await expect(drawer).toBeVisible()
  // Let the drawer finish sliding in.
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
    await openDrawerAfterPlaying(page)
    await page.screenshot({ path: `test-results/drawer-${size.width}.png` })
    expect(await coveringDrawer(page)).toEqual([])
  })
}
