/**
 * The story pane's width: a room description fills the pane as wide as the
 * other story text does, so it reads as part of the same story. Checked in
 * the first room (The Dream) and in Elior's Cottage, on desktop and on a phone.
 */
import { test, expect, type Locator, type Page } from '@playwright/test'

/** The right edge of a block, where its lines can reach. */
async function rightEdge(block: Locator): Promise<number> {
  await expect(block).toBeVisible()
  return block.evaluate((el) => el.getBoundingClientRect().right)
}

/** Start a new game and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page.evaluate(() => document.fonts.ready)
}

/** Type one command into the composer. */
async function type(page: Page, command: string): Promise<void> {
  await page
    .getByRole('button', { name: /^Type( a command)?$/ })
    .first()
    .click()
  const input = page.getByLabel('Command')
  await input.fill(command)
  await input.press('Enter')
}

/** A room's description reaches the same right edge as a story paragraph. */
async function expectAsWideAsStory(
  description: Locator,
  page: Page,
): Promise<void> {
  const paragraph = page.locator('.lq-block-text').first()
  expect(await rightEdge(description)).toBeCloseTo(
    await rightEdge(paragraph),
    0,
  )
}

for (const width of [1280, 360]) {
  test.describe(`at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await start(page)
      // The voice's answer is a story paragraph, and it wakes the player in
      // Elior's Cottage, whose description follows it.
      await type(page, 'talk to voice')
    })

    test('the Dream description is as wide as the story', async ({ page }) => {
      const turn = page.getByTestId('turn').first()
      await expect(turn.locator('.lq-room')).toHaveText('The Dream')
      await expectAsWideAsStory(turn.locator('.lq-arrival-text'), page)
    })

    test("Elior's Cottage description is as wide as the story", async ({
      page,
    }) => {
      const turn = page.getByTestId('turn').last()
      await expect(turn.locator('.lq-room')).toHaveText("Elior's Cottage")
      await expectAsWideAsStory(turn.locator('.lq-arrival-text'), page)
    })
  })
}
