/**
 * The text size setting has five sizes. On a 360px phone the Aa menu stays
 * fully on screen (8px from each edge), the Settings row puts its five A's
 * on their own line under the label without scrolling sideways, and the
 * smallest size survives a reload.
 */
import { test, expect, type Page } from './fixtures'

const PHONE = { width: 360, height: 740 }

/** Start a new game and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  if (page.url() === 'about:blank') await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

test('the Aa menu fits a phone, and the smallest size is kept after a reload', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize(PHONE)
  await start(page)

  await page.getByRole('button', { name: 'Text size', exact: true }).click()
  const menu = page.getByRole('group', { name: 'Text size' })
  await expect(menu.getByRole('button')).toHaveCount(5)
  const box = await menu.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(8)
  expect(box!.x + box!.width).toBeLessThanOrEqual(PHONE.width - 8)

  await menu.getByRole('button', { name: 'Smallest text' }).click()
  await expect(
    menu.getByRole('button', { name: 'Smallest text' }),
  ).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await start(page)
  await page.getByRole('button', { name: 'Text size', exact: true }).click()
  await expect(
    page
      .getByRole('group', { name: 'Text size' })
      .getByRole('button', { name: 'Smallest text' }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('the Settings text size row wraps its A buttons under the label on a phone', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize(PHONE)
  await start(page)

  await page.getByRole('button', { name: 'Game menu' }).click()
  await page.getByRole('button', { name: /^Settings/ }).click()

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
