/**
 * The bigger map (rq-7ql3): on a laptop the open map has a "⤢ Bigger map"
 * button; its window shows the visited places, and pressing one walks Elior
 * there, step by step, leaving an arrival per step. A phone has no button.
 */
import { test, expect, type Page } from './fixtures'

/** Open the game and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

/** Type a command (the laptop's actions have a Type button). */
async function enter(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  const type = page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
  if (await type.isVisible()) await type.click()
  await input.fill(command)
  await input.press('Enter')
}

/** Play the opening of Act I up to the cottage door, where the map has a way out south. */
async function wake(page: Page): Promise<void> {
  const opening = [
    'talk to voice',
    'use lantern',
    'take bread',
    'take lantern',
    'talk to grandmother',
    'use journal',
    'talk to grandmother',
    'search',
    'take faded photograph',
    'examine faded photograph',
    'give faded photograph to grandmother',
  ]
  for (const command of opening) {
    await enter(page, command)
    await page.keyboard.press('Escape')
  }
}

/** The name the plate gives the place the player is in. */
async function placeName(page: Page): Promise<string> {
  const plate = page.getByRole('region', { name: 'Current location' })
  return (await plate.getByRole('heading').innerText()).trim()
}

test('a laptop walks to a visited place from the bigger map', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await start(page)
  await wake(page)
  const home = await placeName(page)

  await page.getByRole('button', { name: '🧭 Map' }).click()
  await page.locator('.lq-map-pop .lq-exit').first().click()
  await expect.poll(() => placeName(page)).not.toBe(home)

  await page.getByRole('button', { name: 'Bigger map', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Map' })
  await expect(dialog).toContainText('You are here')
  await dialog.getByRole('button', { name: `Go to ${home}` }).click()
  await expect(dialog).toHaveCount(0)
  await expect.poll(() => placeName(page)).toBe(home)
  await expect(
    page.getByRole('button', { name: 'Bigger map', exact: true }),
  ).toBeFocused()
})

test('Escape closes the bigger map and leaves the small map open', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await start(page)
  await wake(page)
  await page.getByRole('button', { name: '🧭 Map' }).click()
  await page.getByRole('button', { name: 'Bigger map', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Map' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Map' })).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Bigger map', exact: true }),
  ).toBeVisible()
})

test('a phone has no bigger map', async ({ page }): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 800 })
  await start(page)
  await page.getByRole('button', { name: 'Map', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Map' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Bigger map', exact: true }),
  ).toHaveCount(0)
})

test('every place of Act I fits across the bigger map (rq-7319)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1512, height: 860 })
  await start(page)
  await enter(page, 'debug act1')
  await expect(page.getByText("Debug script 'act1' played")).toBeVisible()
  await page.getByRole('button', { name: '🧭 Map' }).click()
  await page.getByRole('button', { name: 'Bigger map', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Map' })
  await expect(dialog.locator('[data-place="Road to Greendale"]')).toHaveCount(
    1,
  )

  // The body may scroll down, as every window's does, but never sideways:
  // a sideways scroll hides on a laptop and cuts off the places at the edge.
  const overflow = (selector: string): Promise<number> =>
    dialog
      .locator(selector)
      .evaluate((element) => element.scrollWidth - element.clientWidth)
  expect(await overflow('.lq-bigmap-scroll')).toBe(0)
  expect(await overflow('.lq-dialog-content')).toBe(0)
})
