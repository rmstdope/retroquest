/**
 * The card a save just went into keeps room for its words: at desktop width
 * the "Just saved" card shows the whole room name, as the other filled slots
 * do (rq-ibma).
 */
import { test, expect } from './fixtures'

test('Save: the Just saved card shows the full room name at desktop width', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.keyboard.press('Enter')
  const card = page.locator('.lq-slot-on')
  await expect(card.getByText('Just saved')).toBeVisible()
  const room = card.locator('.lq-slot-room')
  await expect(room).toHaveText(/\S/)
  const cut = await room.evaluate((el) => el.scrollWidth > el.clientWidth)
  expect(cut).toBe(false)
})
