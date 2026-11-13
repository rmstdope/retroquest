import { test, expect, type Page } from './fixtures'

/** Wait until the game has loaded and the title page is up. */
async function waitForGame(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const app = (document.querySelector('#app') as any).__vue_app__
    return app && !app.config.globalProperties.$pinia.state.value.game.loading
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
}

test.describe('the title opening on a touch screen', () => {
  test.use({ hasTouch: true })

  test('a tap where Start will appear only finishes the opening', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    await waitForGame(page)
    await expect(page.locator('.lq-title-page')).toHaveClass(/is-playing/)
    const box = (await page.locator('.lq-title-buttons').boundingBox())!
    await page.touchscreen.tap(box.x + box.width / 2, box.y + 20)
    await expect(page.locator('.lq-title-page')).toHaveClass(/is-open/)
    await page.waitForTimeout(800)
    await expect(page.locator('.lq-title-page')).toBeVisible()
    await page.getByRole('button', { name: 'Start', exact: true }).tap()
    await expect(page.locator('.lq-title-page')).toHaveCount(0)
  })
})
