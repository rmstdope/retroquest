/**
 * The room's title (rq-b9zi): walking back into a room tells "You are in" and
 * its name over the middle of the picture, which then settles as the room's
 * name alone in the corner; any key settles it at once. The room card lists
 * no one and nothing.
 */
import { test, expect, type Page } from '@playwright/test'

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

test('any key settles the title at once', async ({ page }): Promise<void> => {
  await playedAct(page)
  await walkBack(page)
  const title = page.getByTestId('room-title')
  await expect(title).toBeVisible()
  await page.keyboard.press('Shift')
  await expect(title).toHaveCount(0, { timeout: 2500 })
})
