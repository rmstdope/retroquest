/**
 * The room's title (rq-b9zi): walking back into a room tells "You are in" and
 * its name over the middle of the picture, which then settles as the room's
 * name alone in the corner; any key settles it at once, and a press on a
 * thing in the picture goes through it. The room card lists no one and nothing.
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

/** Open the real game past its title page, play Act I's script, and leave the command box open. */
async function playedAct(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 })
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
  await page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
    .click()
  await command(page, 'debug act1')
  await expect(page.getByText("Debug script 'act1' played")).toBeVisible()
}

/** Type `text` in the command box and send it. */
async function command(page: Page, text: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  await input.fill(text)
  await input.press('Enter')
}

/** Walk back west into a room already visited, and bring its picture up. */
async function walkBack(page: Page): Promise<void> {
  await command(page, 'go west')
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
}

test('walking back into a room tells its name over the picture, then in the corner', async ({
  page,
}): Promise<void> => {
  await playedAct(page)
  await walkBack(page)
  const title = page.getByTestId('room-title')
  await expect(title).toBeVisible()
  await expect(title).toContainText('You are in')
  const name = (await title.locator('.lq-room-title-name').textContent()) ?? ''
  expect(name.length).toBeGreaterThan(0)
  const corner = page.locator('.lq-stage-plate .lq-room-name')
  await expect(corner).toHaveText(name)
  await expect(corner).toHaveCSS('opacity', '0')
  // It settles by itself: the title goes and the corner's name comes back.
  await expect(title).toHaveCount(0, { timeout: 8000 })
  await expect(corner).toHaveCSS('opacity', '1', { timeout: 4000 })
  await expect(
    page.getByRole('region', { name: 'Current location' }),
  ).not.toContainText('You are in')
})

test('a press on someone in the picture goes through the title, opens their ring and settles it', async ({
  page,
}): Promise<void> => {
  // The studio has placed the priest on the chapel's picture.
  await page.route('**/images/generated/manifest.json', async (route) => {
    const response = await route.fetch()
    const manifest = (await response.json()) as Record<
      string,
      Record<string, unknown>
    >
    manifest['act1-village-chapel'] = {
      ...manifest['act1-village-chapel'],
      areas: { priest: { x: 0.36, y: 0.5, width: 0.1, height: 0.3 } },
    }
    await route.fulfill({ json: manifest })
  })
  await playedAct(page)
  await walkBack(page)
  const title = page.getByTestId('room-title')
  await expect(title).toHaveText(/Village Chapel/)
  // The press lands where the priest is; the picture drifts, so the mouse
  // goes there rather than waiting for the button to stand still.
  const priest = await page.locator('[data-area-press="priest"]').boundingBox()
  if (!priest) throw new Error('the priest is not placed')
  await page.mouse.click(
    priest.x + priest.width / 2,
    priest.y + priest.height / 2,
  )
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(title).toHaveCount(0, { timeout: 2500 })
})

test('any key settles the title at once', async ({ page }): Promise<void> => {
  await playedAct(page)
  await walkBack(page)
  const title = page.getByTestId('room-title')
  await expect(title).toBeVisible()
  await page.keyboard.press('Shift')
  await expect(title).toHaveCount(0, { timeout: 2500 })
})

/**
 * Note every name the corner shows (not faded out), from now until `told`
 * is on the page (the arrival or the title telling the room).
 */
async function watchCorner(page: Page, told: string): Promise<void> {
  await page.evaluate((doneSelector) => {
    const seen: string[] = []
    ;(window as unknown as { cornerSeen: string[] }).cornerSeen = seen
    const look = (): void => {
      const name = document.querySelector('.lq-stage-plate .lq-room-name')
      if (name && name.textContent && getComputedStyle(name).opacity !== '0')
        seen.push(name.textContent)
      if (!document.querySelector(doneSelector)) requestAnimationFrame(look)
    }
    requestAnimationFrame(look)
  }, told)
}

/** The names the corner showed since `watchCorner`. */
async function cornerSeen(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { cornerSeen: string[] }).cornerSeen,
  )
}

const ARRIVAL_UP = '[data-testid="arrival-on-picture"].lq-on'
const TITLE_UP = '[data-testid="room-title"]'

test('starting the game names no room in the corner before the first room is told', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await watchCorner(page, ARRIVAL_UP)
  await page.locator('.lq-chapter-button').click()
  await expect(page.locator(ARRIVAL_UP)).toBeVisible()
  expect(await cornerSeen(page)).toEqual([])
})

test('waking into a new room does not name it in the corner before its arrival tells it', async ({
  page,
}): Promise<void> => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  const arrival = page.locator(ARRIVAL_UP)
  await expect(arrival).toBeVisible()
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  await page
    .getByRole('region', { name: /^Action/ })
    .getByRole('button', { name: /^(Type|Type a command)$/ })
    .click()
  await watchCorner(page, ARRIVAL_UP)
  await command(page, 'say hello to voice')
  // The waking is read in the dark first (about fifteen seconds unnarrated).
  await expect(arrival).toContainText("Elior's Cottage", { timeout: 40_000 })
  expect(await cornerSeen(page)).not.toContain("Elior's Cottage")
})

test('walking back into a room does not name it in the corner before its title tells it', async ({
  page,
}): Promise<void> => {
  await playedAct(page)
  await watchCorner(page, TITLE_UP)
  await command(page, 'go west')
  const title = page.getByTestId('room-title')
  await expect(title).toBeVisible()
  const name = (await title.locator('.lq-room-title-name').textContent()) ?? ''
  expect(name.length).toBeGreaterThan(0)
  expect(await cornerSeen(page)).not.toContain(name)
})
