import { test, expect, type Page } from '@playwright/test'

/** Open the game on a laptop and close the opening chapter page: the first room arrives. */
async function startAct1(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

const arrival = (page: Page) => page.getByTestId('arrival-on-picture')
const story = (page: Page) => page.getByRole('region', { name: 'Story' })

test.describe('the arrival told on the picture', () => {
  test('tells the first room on the picture, the story aside, and a click clears it', async ({
    page,
  }) => {
    await startAct1(page)

    const line = arrival(page).locator('.lq-arrival-line')
    await expect(line).toBeVisible()
    await expect(line).not.toHaveText('')
    await expect(
      arrival(page).getByText('Click or press Enter to continue'),
    ).toBeVisible()
    // Narration is off here: the reading-time bar shows.
    await expect(page.getByTestId('arrival-bar')).toBeVisible()
    await expect(story(page)).toBeHidden()
    const tab = page.getByRole('button', { name: /Narration/ }).first()
    await expect(tab).toBeVisible()

    await arrival(page).click({ position: { x: 600, y: 300 } })
    await expect(line).toHaveCount(0)
    await expect(tab).toHaveCount(0)
    await expect(story(page)).toBeVisible()
    await expect(story(page).locator('.lq-arrival-text')).not.toHaveText('')
  })

  test('goes on with Enter', async ({ page }) => {
    await startAct1(page)
    await expect(arrival(page).locator('.lq-arrival-line')).toBeVisible()
    const commands = page.getByTestId('command')
    const before = await commands.count()
    await page.keyboard.press('Enter')
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
    await expect(story(page)).toBeVisible()
    // Enter went on; it did not press the focused verb.
    await expect(commands).toHaveCount(before)
  })

  test('clears when an action is chosen', async ({ page }) => {
    await startAct1(page)
    await expect(arrival(page).locator('.lq-arrival-line')).toBeVisible()
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
    await expect(story(page)).toBeVisible()
  })

  test('clears when the player types, and keeps what was typed', async ({
    page,
  }) => {
    await startAct1(page)
    await page
      .getByRole('region', { name: 'Actions' })
      .getByRole('button', { name: 'Type', exact: true })
      .click()
    // Another arrival, with the command box already open.
    await page.evaluate(() => {
      const app = (
        document.querySelector('#app') as unknown as {
          __vue_app__: {
            config: {
              globalProperties: {
                $pinia: { state: { value: { game: { turns: unknown[] } } } }
              }
            }
          }
        }
      ).__vue_app__
      app.config.globalProperties.$pinia.state.value.game.turns.push({
        id: 999,
        command: null,
        text: '',
        room: 'Nowhere',
        description: { moved: true, firstVisit: true },
        gained: [],
        lost: [],
        narrate: true,
        arrival: {
          room: 'Nowhere',
          description: 'Some place.',
          characters: [],
          items: [],
          exits: {},
        },
      })
    })
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveText(
      'Some place.',
    )
    const input = page.getByLabel('Command')
    await input.focus()
    await page.keyboard.type('look')
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
    await expect(input).toHaveValue('look')
  })

  test('has no slide under Reduce motion, and the bar still runs', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await startAct1(page)
    await expect(arrival(page).locator('.lq-arrival-line')).toBeVisible()
    await expect(page.getByTestId('arrival-bar').locator('i')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
  })

  test('leaves a phone as it was', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    await expect(arrival(page)).toHaveCount(0)
    await expect(story(page)).toBeVisible()
  })
})
