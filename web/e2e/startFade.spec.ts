import { test, expect } from './fixtures'

/**
 * Starting a game goes through the dark (rq-umlh): the title fades out, the
 * intro rises, and a click during the fade only brings the intro up. The
 * suite's reduced motion is turned off here; with it on there is no fade.
 */
test.describe('the passage into a new game', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
  })

  test('the title fades out, then the intro is up and takes focus', async ({
    page,
  }): Promise<void> => {
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await expect(page.locator('.lq-passage-out')).toBeAttached()
    await expect(page.locator('.lq-chapter-button')).toBeFocused({
      timeout: 6000,
    })
    await expect(page.locator('.lq-passage-idle')).toBeAttached()
  })

  test('a click during the fade brings the intro up and does not press its button', async ({
    page,
  }): Promise<void> => {
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await expect(page.locator('.lq-passage-out')).toBeAttached()
    await page.mouse.click(720, 400)
    await expect(page.locator('.lq-passage-idle')).toBeAttached()
    await expect(page.locator('.lq-chapter-button')).toBeVisible()
  })
})
