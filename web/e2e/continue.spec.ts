/**
 * A returning player picks a save up from the title page: Continue opens the
 * newest save at once, Load game opens the save window without a question,
 * New game starts afresh, and with no saves the page offers Start only.
 */
import { test, expect, type Page, enterCommand } from './fixtures'

/** Start a game, close the opening chapter page and save (a quick save, or under a name with `save <name>`). */
async function makeSave(page: Page, command = 'save'): Promise<void> {
  await page.addInitScript(() => {
    if (!localStorage.getItem('retroquest_settings'))
      localStorage.setItem('retroquest_settings', '{"narrationVolume":0}')
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await enterCommand(page, command)
  await expect(page.getByText('Game saved').first()).toBeVisible()
}

test('with no saves the title page offers Start only', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Start', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0)
})

test('Continue opens the newest save with no chapter page', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()

  const cont = page.getByRole('button', { name: /^Continue/ })
  await expect(cont).toBeFocused()
  await expect(cont.locator('.lq-continue-title')).toHaveText('The Dream')
  await expect(cont.locator('.lq-continue-line')).toContainText('Act I · ')
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible()
  await cont.click()

  await expect(page.locator('.lq-title-page')).toHaveCount(0)
  await expect(page.locator('.lq-chapter-button')).toHaveCount(0)
  // The room is told as a first visit is (rq-fl1v): heading, name and description.
  const told = page.locator('.lq-arrival-card')
  await expect(told).toBeVisible()
  await expect(told).toContainText('You are in')
  await expect(told).toContainText('Click to continue · Hold to skip')
  await expect(told.locator('.lq-arrival-line')).not.toHaveText('')
  await expect(page.locator('.lq-room-title')).toHaveCount(0)
  await told.click()
  // A card under the mouse waits (rq-ir2c): off it, any page left is read and goes.
  await page.mouse.move(0, 0)
  await expect(told).toHaveCount(0)
  await expect(page.locator('.lq-room-name')).toBeVisible()
})

test('the Continue card shows a small picture of the room the save was made in', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()

  const cont = page.getByRole('button', { name: /^Continue/ })
  const picture = cont.locator('.lq-continue-picture')
  await expect(picture).toBeVisible()
  await expect(picture).toHaveAttribute('aria-hidden', 'true')
  await expect(picture.locator('img').first()).toHaveAttribute(
    'src',
    /images\/generated\/thumbs\/.+\.webp$/,
  )
})

test('the Load window shows the same small picture on the save, with its mark on the corner', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()

  await page.getByRole('button', { name: 'Load game' }).click()
  const quick = page
    .getByRole('dialog', { name: 'Load game' })
    .locator('[data-slot="0"]')
  const picture = quick.locator('.lq-slot-thumb')
  await expect(picture).toBeVisible()
  await expect(picture).toHaveAttribute('aria-hidden', 'true')
  await expect(picture.locator('img').first()).toHaveAttribute(
    'src',
    /images\/generated\/thumbs\/.+\.webp$/,
  )
  await expect(quick.locator('.lq-slot-lead .lq-slot-badge')).toHaveText('Q')
  await expect(page.locator('[data-slot="1"] .lq-slot-thumb')).toHaveCount(0)
})

test('opening Load fetches the small copies of the pictures, never the full paintings', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()
  // The title page's own backdrop is not the snapshot: let it settle first.
  await page.waitForLoadState('networkidle')
  const fetched: string[] = []
  page.on('request', (request) => fetched.push(request.url()))

  await page.getByRole('button', { name: 'Load game' }).click()
  const quick = page
    .getByRole('dialog', { name: 'Load game' })
    .locator('[data-slot="0"]')
  await expect(quick.locator('.lq-slot-thumb img').first()).toBeVisible()

  const pictures = fetched.filter((url) => url.includes('/images/generated/'))
  for (const url of pictures) expect(url).toMatch(/\/thumbs\/.+\.webp$/)
})

test('Load game from the title page loads a card with no question', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()

  await page.getByRole('button', { name: 'Load game' }).click()
  const dialog = page.getByRole('dialog', { name: 'Load game' })
  await expect(dialog.getByText('Pick a save to go back to.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Load game' })).toBeFocused()

  await page.getByRole('button', { name: 'Load game' }).click()
  await dialog.locator('[data-slot="0"] .lq-slot-btn').click()
  await expect(page.locator('.lq-title-page')).toHaveCount(0)
  await expect(page.locator('.lq-chapter-button')).toHaveCount(0)
})

test('New game starts at the chapter page and keeps the saves', async ({
  page,
}) => {
  await makeSave(page)
  await page.reload()

  await page.getByRole('button', { name: 'New game' }).click()
  await expect(page.locator('.lq-chapter-button')).toBeVisible()
  const saved = await page.evaluate(() =>
    localStorage.getItem('retroquest_save'),
  )
  expect(saved).not.toBeNull()
})

test('a save made under a name is listed on the title page after a reload and loads', async ({
  page,
}) => {
  await makeSave(page, 'save mysave')
  await page.reload()

  const cont = page.getByRole('button', { name: /^Continue/ })
  await expect(cont.locator('.lq-continue-title')).toHaveText('The Dream')
  await expect(cont.locator('.lq-continue-line')).toContainText(
    'mysave · Act I · ',
  )

  await page.getByRole('button', { name: 'Load game' }).click()
  const dialog = page.getByRole('dialog', { name: 'Load game' })
  await expect(dialog.getByText('Saves you named')).toBeVisible()
  await dialog.getByRole('button', { name: /^Load mysave:/ }).click()
  await expect(page.locator('.lq-title-page')).toHaveCount(0)
  await expect(page.locator('.lq-room-name')).toBeVisible()
})
