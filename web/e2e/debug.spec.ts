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

/** Wait for the real game to load, then close the title page and act intro. */
async function openGame(page: Page) {
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

test.describe('debug command (dev server)', () => {
  test('names a script that does not exist', async ({ page }) => {
    await openGame(page)
    await page
      .getByRole('region', { name: 'Actions' })
      .getByRole('button', { name: 'Type', exact: true })
      .click()
    const input = page.getByLabel('Command')

    await input.fill('debug nothing-here')
    await input.press('Enter')
    await expect(page.getByText("'nothing-here' not found")).toBeVisible()
  })
})
