import { test, expect, enterCommand } from './fixtures'

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

/**
 * A load typed while a loaded game rises out of the dark (rq-r9ax): the
 * screen comes fully up before the new fade-out begins, and the first load's
 * notice never shows over the darkening screen.
 */
test.describe('loading again during the fade into a loaded game', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await expect(page.locator('.lq-chapter-button')).toBeFocused({
      timeout: 6000,
    })
    await page.locator('.lq-chapter-button').click()
    await enterCommand(page, 'save')
    await expect(page.getByText('Game saved').first()).toBeVisible()
  })

  test('the screen comes fully up before the new fade-out, with no notice in the dark', async ({
    page,
  }): Promise<void> => {
    await enterCommand(page, 'load')
    await expect(page.locator('.lq-passage-in')).toBeAttached({
      timeout: 6000,
    })
    await enterCommand(page, 'load')
    await expect(page.locator('.lq-passage-out')).toBeAttached()
    const opacity = await page
      .locator('.lq-passage')
      .evaluate((el) => Number(getComputedStyle(el).opacity))
    expect(opacity).toBeLessThan(0.3)
    await expect(
      page.locator('.lq-toast', { hasText: 'Game loaded' }),
    ).toHaveCount(0)
    await expect(page.locator('.lq-passage-idle')).toBeAttached({
      timeout: 6000,
    })
    await expect(page.locator('.lq-toast')).toHaveText('Game loaded')
  })

  test('a load typed while the screen goes dark is taken and starts its own fade (rq-6fs0)', async ({
    page,
  }): Promise<void> => {
    await enterCommand(page, 'load')
    await expect(page.locator('.lq-passage-out')).toBeAttached()
    // Late in the first fade-out, so a fade still going after it is the second load's.
    await page.waitForTimeout(1000)
    await enterCommand(page, 'load')
    await expect(page.getByLabel('Command', { exact: true })).toHaveValue('')
    await page.waitForTimeout(800)
    expect(await page.locator('.lq-passage').getAttribute('class')).toContain(
      'lq-passage-out',
    )
    await expect(
      page.locator('.lq-toast', { hasText: 'Game loaded' }),
    ).toHaveCount(0)
    await expect(page.locator('.lq-passage-idle')).toBeAttached({
      timeout: 6000,
    })
    await expect(page.locator('.lq-toast')).toHaveText('Game loaded')
  })
})
