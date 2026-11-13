/**
 * Phones are played sideways (rq-ezpg.5): a touch screen whose shorter side is
 * under 600 pixels shows only a turn page while upright and the stage made
 * small on its side; a tablet upright keeps the tall stage.
 */
import { test, expect, type Page } from './fixtures'

/** A touch screen, as a phone or a tablet reports itself. */
test.use({ hasTouch: true, isMobile: true })

/** Open the game and close the opening chapter page. */
async function start(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

test('an upright phone shows only the turn page, over every screen', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Turn your phone on its side' }),
  ).toBeVisible()
  await expect(page.locator('.lq-game')).toHaveAttribute('inert', '')
})

for (const size of [
  { width: 844, height: 390 },
  { width: 568, height: 320 },
]) {
  test(`a sideways phone ${size.width}×${size.height} plays on the picture`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize(size)
    await start(page)
    await expect(page.locator('.lq-stage-picture')).toBeVisible()
    await expect(page.locator('.lq-header')).toHaveCount(0)
    await expect(page.locator('.lq-nav-bottom')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Actions ▴' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hint' })).toBeVisible()
    // One compact row: it never covers the words.
    const plate = await page.locator('.lq-stage-plate').boundingBox()
    expect(plate?.height ?? 999).toBeLessThan(60)
    // And it ends before the first button on the right.
    const bag = await page.locator('.lq-stage-buttons').boundingBox()
    expect((plate?.x ?? 0) + (plate?.width ?? 999)).toBeLessThanOrEqual(
      bag?.x ?? 0,
    )
    const noScroll = await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    )
    expect(noScroll).toBe(true)
    await page.screenshot({
      path: `test-results/sideways-${size.width}x${size.height}.png`,
    })
    // The sheet is above the scrim: a press on its first verb lands.
    await page.getByRole('button', { name: 'Actions ▴' }).click()
    await page
      .getByRole('button', { name: 'Look', exact: true })
      .first()
      .click()
    await page.getByRole('button', { name: 'Actions ▴' }).waitFor()
    if (size.height <= 340) {
      await expect(page.getByRole('button', { name: 'Bag' })).toBeVisible()
      await expect(page.locator('.lq-hint-word')).toBeHidden()
    } else {
      await expect(page.locator('.lq-hint-word')).toBeVisible()
    }
    await page.locator('.lq-float-menu').click()
    await expect(page.getByText('Quick save')).toBeVisible()
    await expect(page.getByText('Text size')).toBeVisible()
  })
}

/** Light the new dots (Quests on the top row; Bag and Spells on the belt's tiny buttons) and name the room, as the store records them. */
async function lightDots(page: Page, roomName: string): Promise<void> {
  await page.evaluate((name) => {
    const app = (
      document.querySelector('#app') as unknown as {
        __vue_app__: {
          config: {
            globalProperties: {
              $pinia: { state: { value: { game: Record<string, unknown> } } }
            }
          }
        }
      }
    ).__vue_app__
    const game = app.config.globalProperties.$pinia.state.value.game
    game.bagHasNew = true
    game.spellsHaveNew = true
    game.questsHaveNew = true
    game.roomName = name
  }, roomName)
}

for (const size of [
  { width: 568, height: 320 },
  { width: 640, height: 360 },
]) {
  test(`with every dot lit at ${size.width}×${size.height} the plate stays clear of the buttons and the name is whole`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize(size)
    await start(page)
    await lightDots(page, 'Abandoned Shed')
    // The belt shows the Bag, which counts as seen: Quests and the Spells button keep their dots.
    await expect(page.locator('.lq-dot')).toHaveCount(2)
    // The plate follows the buttons' width a frame after the dots light.
    await expect
      .poll(async (): Promise<number> => {
        const plate = await page.locator('.lq-stage-plate').boundingBox()
        const quests = await page.locator('.lq-stage-buttons').boundingBox()
        return (quests?.x ?? 0) - ((plate?.x ?? 0) + (plate?.width ?? 999))
      })
      .toBeGreaterThanOrEqual(0)
    const name = page.locator('.lq-stage-plate .lq-room-name')
    await expect(name).toHaveText('Abandoned Shed')
    await expect
      .poll(() => name.evaluate((el) => el.scrollWidth - el.clientWidth))
      .toBeLessThanOrEqual(0)
  })
}

test('a name too long for the corner stays one row and ends before the buttons', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 568, height: 320 })
  await start(page)
  await lightDots(page, 'Submerged Antechamber')
  const name = page.locator('.lq-stage-plate .lq-room-name')
  await expect(name).toHaveText('Submerged Antechamber')
  await expect
    .poll(async (): Promise<number> => {
      const plate = await page.locator('.lq-stage-plate').boundingBox()
      const buttons = await page.locator('.lq-stage-buttons').boundingBox()
      return (buttons?.x ?? 0) - ((plate?.x ?? 0) + (plate?.width ?? 999))
    })
    .toBeGreaterThanOrEqual(0)
  const row = await name.boundingBox()
  expect(row?.height ?? 999).toBeLessThan(30)
})

test('a tablet held upright keeps the tall stage, with no turn page', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await start(page)
  await expect(page.locator('.lq-turn-page')).toHaveCount(0)
  await expect(page.locator('.lq-nav-bottom')).toBeVisible()
})
