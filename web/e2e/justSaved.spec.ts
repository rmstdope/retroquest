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

test('Save: a card with a room picture shows a long room name in full at desktop width', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Save game' })
  await expect(dialog.getByText('Just saved')).toBeVisible()
  // Copy that save, picture and all, into slot 2 as one made in the longest-named room.
  await page.evaluate(() => {
    const slots = JSON.parse(
      localStorage.getItem('retroquest_save_slots') ?? '[]',
    ) as ({ room?: string } | null)[]
    slots[1] = { ...slots[0], room: "Entrance to Malakar's Fortress" }
    localStorage.setItem('retroquest_save_slots', JSON.stringify(slots))
  })
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const card = dialog.locator('[data-slot="2"]')
  await expect(card.locator('.lq-slot-pictured')).toBeVisible()
  const room = card.locator('.lq-slot-room')
  await expect(room).toHaveText("Entrance to Malakar's Fortress")
  const cut = await room.evaluate((el) => el.scrollWidth > el.clientWidth)
  expect(cut).toBe(false)
})
