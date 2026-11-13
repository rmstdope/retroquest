/**
 * The narrator's words on paper cards up the left side of the picture on a
 * laptop (rq-c15r.1): the story pane is gone, the cards stop under the room
 * plate and never overlap the speech, also in a window about 1060 px wide.
 */
import { test, expect, type Page } from './fixtures'

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

for (const width of [1440]) {
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
    // The look's description is a bubble on the left; no command is echoed.
    await expect(cards.locator('.lq-bubble').first()).toBeVisible()
    await expect(cards.getByTestId('command')).toHaveCount(0)
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

test('at 1060px the cards and the lines share one column in the middle, under the plate', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1060, height: 800 })
  await start(page)
  await enter(page, 'talk to voice')
  await page.keyboard.press('Escape')
  await enter(page, 'look')
  await enter(page, 'talk to grandmother')

  const column = page.locator('.lq-story-wrap.lq-one-column')
  await expect(column.locator('.lq-bubble').first()).toBeVisible()
  await expect(column.getByTestId('command')).toHaveCount(0)
  const lines = column.getByTestId('speech-line')
  await expect(lines.first()).toBeVisible()

  const wrap = (await column.boundingBox())!
  const plate = (await page.locator('.lq-stage-plate').boundingBox())!
  expect(wrap.y).toBeGreaterThanOrEqual(plate.y + plate.height)
  expect(wrap.width).toBeLessThanOrEqual(620)
  expect(Math.abs(wrap.x + wrap.width / 2 - 530)).toBeLessThan(2)
  // The speech is in the column, none beside it.
  await expect(page.locator('.lq-speech-zone')).toHaveCount(0)
  for (let i = 0; i < (await lines.count()); i++) {
    const box = (await lines.nth(i).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(wrap.x)
    expect(box.x + box.width).toBeLessThanOrEqual(wrap.x + wrap.width + 1)
  }
})

test.describe('with the narrator reading', () => {
  // Narration on, as for a new player (the config turns it off for the other specs).
  test.use({
    storageState: { cookies: [], origins: [] },
    narrationRecordings: true,
  })

  test('after Escape skips an answer the newest turn is in view at its start', async ({
    page,
  }): Promise<void> => {
    // Narrated clips end three seconds after they start (no audio device in CI).
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        if (this.src.includes('/audio/narration/'))
          setTimeout(() => this.dispatchEvent(new Event('ended')), 3000)
        return Promise.resolve()
      }
    })
    await page.setViewportSize({ width: 1440, height: 800 })
    await start(page)
    await enter(page, 'talk to voice')
    await page.keyboard.press('Escape')
    await enter(page, 'look')
    await page.keyboard.press('Escape')
    await enter(page, 'talk to grandmother')
    await page.keyboard.press('Escape')
    await enter(page, 'xyzzy')
    await enter(page, 'look')
    await page.keyboard.press('Escape')

    const wrap = page.locator('.lq-story-wrap.lq-cards')
    // The look's first bubble (the room) is the newest turn's start.
    const newestStart = wrap
      .getByTestId('turn')
      .last()
      .locator('.lq-bubble')
      .first()
    await expect(newestStart).toBeVisible()
    const view = (await wrap.locator('.lq-story').boundingBox())!
    const top = (await newestStart.boundingBox())!.y
    expect(top).toBeGreaterThanOrEqual(view.y)
    // Its top is clear of the "More below" pill at the foot.
    expect(top + 24).toBeLessThanOrEqual(view.y + view.height - 48)
  })
})
