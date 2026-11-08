/**
 * Phones are played sideways (rq-ezpg.5): a touch screen whose shorter side is
 * under 600 pixels shows only a turn page while upright and the stage made
 * small on its side; a tablet upright keeps the tall stage.
 */
import { test, expect, type Page } from '@playwright/test'

/** A touch screen, as a phone or a tablet reports itself. */
test.use({ hasTouch: true, isMobile: true })

/** Open the game and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

test('an upright phone shows only the turn page, over every screen', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Turn your phone on its side' }),
  ).toBeVisible()
  await expect(page.locator('.lq-game')).toHaveAttribute('inert', '')
})

for (const size of [
  { width: 844, height: 390 },
  { width: 568, height: 320 },
]) {
  test(`a sideways phone ${size.width}×${size.height} plays on the picture`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize(size)
    await start(page)
    await expect(page.locator('.lq-stage-picture')).toBeVisible()
    await expect(page.locator('.lq-header')).toHaveCount(0)
    await expect(page.locator('.lq-nav-bottom')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Actions ▴' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hint' })).toBeVisible()
    // One compact row, however many chips: it never covers the words.
    const plate = await page.locator('.lq-stage-plate').boundingBox()
    expect(plate?.height ?? 999).toBeLessThan(60)
    const noScroll = await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    )
    expect(noScroll).toBe(true)
    await page.screenshot({
      path: `test-results/sideways-${size.width}x${size.height}.png`,
    })
    // The sheet is above the scrim: a press on its first verb lands.
    await page.getByRole('button', { name: 'Actions ▴' }).click()
    await page
      .getByRole('button', { name: 'Look', exact: true })
      .first()
      .click()
    await page.getByRole('button', { name: 'Actions ▴' }).waitFor()
    if (size.height <= 340) {
      await expect(
        page.getByRole('button', { name: /^Bag \d+$/ }),
      ).toBeVisible()
      await expect(page.locator('.lq-hint-word')).toBeHidden()
    } else {
      await expect(page.locator('.lq-hint-word')).toBeVisible()
    }
    await page.locator('.lq-float-menu').click()
    await expect(page.getByText('Quick save')).toBeVisible()
    await expect(page.getByText('Text size')).toBeVisible()
  })
}

test('a tablet held upright keeps the tall stage, with no turn page', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await start(page)
  await expect(page.locator('.lq-turn-page')).toHaveCount(0)
  await expect(page.locator('.lq-nav-bottom')).toBeVisible()
})
