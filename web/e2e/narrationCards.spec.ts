/**
 * The narrator's words on paper cards up the left side of the picture on a
 * laptop (rq-c15r.1): the story pane is gone, the cards stop under the room
 * plate and never overlap the speech, also in a window about 1060 px wide.
 */
import { test, expect, type Page } from '@playwright/test'

/** Open the game, close the opening chapter page and switch the actions to typing. */
async function start(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
    .click()
}

/** Type a command. */
async function enter(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  await input.fill(command)
  await input.press('Enter')
}

for (const width of [1440, 1060]) {
  test(`at ${width}px the cards sit up the left, under the plate, clear of the speech`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: 800 })
    await start(page)
    await enter(page, 'talk to voice')
    // The walk into the first room is told in the middle first.
    await page.keyboard.press('Escape')
    await enter(page, 'look')
    await enter(page, 'talk to grandmother')

    const cards = page.locator('.lq-story-wrap.lq-cards')
    await expect(cards.getByText('› talk to grandmother')).toBeVisible()
    await expect(cards.getByText('› look')).toBeVisible()
    const lines = page.getByTestId('speech-line')
    await expect(lines.first()).toBeVisible()

    const wrap = (await cards.boundingBox())!
    const plate = (await page.locator('.lq-stage-plate').boundingBox())!
    expect(wrap.x).toBeLessThan(40)
    expect(wrap.y).toBeGreaterThanOrEqual(plate.y + plate.height)
    expect(wrap.width).toBeLessThanOrEqual(520)

    // Speech lines of the people spoken to are at the right: none under a card.
    const right = page.locator('.lq-line-right')
    for (let i = 0; i < (await right.count()); i++) {
      const box = (await right.nth(i).boundingBox())!
      expect(box.x).toBeGreaterThan(wrap.x + wrap.width)
    }
  })
}
