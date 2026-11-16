/**
 * The text size setting has five sizes. On a 360px phone the Settings row
 * puts its five A's on their own line under the label without scrolling
 * sideways.
 */
import { test, expect, type Page } from './fixtures'

const PHONE = { width: 360, height: 740 }

/** Start a new game and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  if (page.url() === 'about:blank') await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

test('the Settings text size row wraps its A buttons under the label on a phone', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize(PHONE)
  await start(page)

  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()

  const label = page
    .getByRole('dialog')
    .getByText('Text size', { exact: true })
    .first()
  const sizes = page
    .getByRole('dialog')
    .getByRole('group', { name: 'Text size' })
  await expect(sizes.getByRole('button')).toHaveCount(5)
  const labelBox = await label.boundingBox()
  const sizesBox = await sizes.boundingBox()
  expect(sizesBox!.y).toBeGreaterThanOrEqual(labelBox!.y + labelBox!.height)
  expect(sizesBox!.x + sizesBox!.width).toBeLessThanOrEqual(PHONE.width)

  const noSidewaysScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  )
  expect(noSidewaysScroll).toBe(true)
})
