import { test, expect, type Page } from '@playwright/test'

/** Wait for the real game to load, then close the title page and act intro. */
async function openGame(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const app = (document.querySelector('#app') as any).__vue_app__
    return app && !app.config.globalProperties.$pinia.state.value.game.loading
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const app = (document.querySelector('#app') as any).__vue_app__
    const store = app.config.globalProperties.$pinia.state.value.game
    store.showTitle = false
    store.showModal = false
    store.modalChapter = null
    store.modalQuest = null
    store.modalQueue = []
    store.acceptInput = true
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
}

test.describe('debug command (dev server)', () => {
  test('plays the Act I script and leaves one command to finish the act', async ({
    page,
  }) => {
    await openGame(page)
    await page
      .getByRole('region', { name: 'Actions' })
      .getByRole('button', { name: 'Type', exact: true })
      .click()
    const input = page.getByLabel('Command')

    await input.fill('debug act1')
    await input.press('Enter')
    await expect(page.getByText("Debug script 'act1' played")).toBeVisible()

    await input.fill('use map')
    await input.press('Enter')
    await expect(page.getByText(/main quest complete/i).first()).toBeVisible()
  })

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
