/**
 * Saves made by an older version of the game (a save format it has since
 * replaced) are shown for what they are before the player picks them: dimmed
 * with the reason in Load game, still replaceable (after asking) in Save
 * game, a dimmed Quick load in the menu, and one plain line when `load` is
 * typed, with the game left where it was.
 */
import { test, expect, type Page } from '@playwright/test'

/** The game menu (☰) is in the phone's header. */
const PHONE = { width: 360, height: 740 }
const REASON = "Made by an older version · can't be loaded"
const OLD_LINE =
  'That save was made by an older version of RetroQuest' +
  ' and can no longer be loaded.'

/** Seed an old quick save and an old save in slot 2 (format 2, from 20 Oct). */
async function seedOldSaves(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const old = JSON.stringify({ version: 2, actIndex: 2, state: {} })
    const slots: unknown[] = Array(8).fill(null)
    slots[1] = {
      slot: 2,
      act: 'Act 3',
      room: 'The Whispering Marsh',
      timestamp: '2026-10-20T19:02:00.000Z',
      data: old,
    }
    localStorage.setItem('retroquest_settings', '{"narrationOn":false}')
    localStorage.setItem('retroquest_save_slots', JSON.stringify(slots))
    localStorage.setItem('retroquest_save', old)
    localStorage.setItem(
      'retroquest_save_meta',
      JSON.stringify({ act: 'Act 3', timestamp: '2026-10-20T21:14:00.000Z' }),
    )
  })
}

/** Start a new game (the title page offers New game when saves exist) and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'New game', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

test('old saves are dimmed with their reason and cannot be loaded', async ({
  page,
}) => {
  await page.setViewportSize(PHONE)
  await seedOldSaves(page)
  await start(page)

  await page.getByRole('button', { name: 'Game menu' }).click()
  const quickLoad = page.getByRole('button', { name: /^Quick load/ })
  await expect(quickLoad).toBeDisabled()
  await expect(quickLoad).toContainText(
    'The quick save is from an older version',
  )

  await page.getByRole('button', { name: /^Save game/ }).click()
  const saving = page.getByRole('dialog', { name: 'Save game' })
  await saving.locator('[data-slot="1"] .lq-slot-btn').click()
  await expect(saving.locator('[data-slot="1"]')).toContainText('Just saved')
  await page.keyboard.press('Escape')
  await expect(saving).toHaveCount(0)

  await page.getByRole('button', { name: 'Game menu' }).click()
  await page.getByRole('button', { name: /^Load game/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Load game' })
  await expect(dialog.getByText('Pick a save to go back to.')).toBeVisible()
  for (const slot of ['0', '2']) {
    const card = dialog.locator(`[data-slot="${slot}"]`)
    await expect(card.locator('.lq-slot-btn')).toBeDisabled()
    await expect(card.locator('.lq-slot-why')).toHaveText(REASON)
  }
  await expect(dialog.locator('[data-slot="2"]')).toContainText(
    'The Whispering Marsh',
  )
  const good = dialog.locator('[data-slot="1"]')
  await expect(good.locator('.lq-slot-btn')).toBeEnabled()
  await expect(good.locator('.lq-slot-why')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('an old slot can be saved over after asking', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await seedOldSaves(page)
  await start(page)

  await page.getByRole('button', { name: 'Game menu' }).click()
  await page.getByRole('button', { name: /^Save game/ }).click()
  const card = page
    .getByRole('dialog', { name: 'Save game' })
    .locator('[data-slot="2"]')
  await expect(card.locator('.lq-slot-why')).toHaveText(REASON)
  await card.locator('.lq-slot-btn').click()
  await expect(card).toContainText('Replace this save with your current game?')
  await card.getByRole('button', { name: 'Replace' }).click()

  await expect(card).toContainText('Just saved')
  await expect(card.locator('.lq-slot-why')).toHaveCount(0)
})

test('typing load for an old save says so and leaves the game as it was', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await seedOldSaves(page)
  await start(page)

  await page
    .getByRole('button', { name: /^Type( a command)?$/ })
    .first()
    .click()
  const turns = page.locator('.lq-story .lq-turn')
  const act = page.getByTestId('act')
  const actBefore = await act.textContent()
  const turnsBefore = await turns.count()
  const input = page.getByLabel('Command')
  await input.fill('load')
  await input.press('Enter')

  await expect(turns).toHaveCount(turnsBefore + 1)
  await expect(turns.last()).toContainText(OLD_LINE)
  await expect(act).toHaveText(actBefore ?? '')
  await expect(page.locator('.lq-story')).not.toContainText(
    'Failed to load game',
  )
})
