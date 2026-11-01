/**
 * The one Hide on a laptop (rq-c15r.5): a single "▾ Hide" at the bottom centre
 * of the picture, on its own line, with the narrator's cards and the speech
 * ending above it at every width; it clears both sides and leaves "▴ Show".
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
  test(`at ${width}px one Hide rests at the bottom centre and clears both sides`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: 800 })
    await start(page)
    await enter(page, 'talk to voice')
    await page.keyboard.press('Escape')
    await enter(page, 'look')
    await enter(page, 'talk to grandmother')

    const cards = page.locator('.lq-story-wrap.lq-cards')
    const zone = page.getByTestId('speech-zone')
    const hide = page.getByRole('button', { name: '▾ Hide' })
    const show = page.getByRole('button', { name: '▴ Show' })
    await expect(page.getByTestId('speech-line').first()).toBeVisible()
    await expect(hide).toHaveCount(1)
    await expect(
      page.getByRole('button', { name: 'Clear the conversation' }),
    ).toHaveCount(0)

    const button = (await hide.boundingBox())!
    const stage = (await page.locator('.lq-stage-plate').boundingBox())!
    const wrap = (await cards.boundingBox())!
    const room = (await zone.boundingBox())!
    // At the horizontal centre of the picture, below both sides.
    const viewport = page.viewportSize()!
    expect(
      Math.abs(button.x + button.width / 2 - viewport.width / 2),
    ).toBeLessThan(2)
    expect(wrap.y + wrap.height).toBeLessThanOrEqual(button.y)
    expect(room.y + room.height).toBeLessThanOrEqual(button.y + 1)
    expect(stage.y).toBeLessThan(button.y)

    await hide.click()
    await expect(show).toBeFocused()
    await expect(cards).toBeHidden()
    await expect(page.getByTestId('speech-line').first()).toBeHidden()
    await expect(hide).toHaveCount(0)

    await show.click()
    await expect(hide).toBeFocused()
    await expect(cards.getByText('› talk to grandmother')).toBeVisible()
    await expect(page.getByTestId('speech-line').first()).toBeVisible()
  })
}
