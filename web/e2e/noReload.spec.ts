/**
 * Play stays on one page: typing Act I's golden path into the command box,
 * one command at a time, through the Abandoned Shed and north out of it,
 * never reloads the page or sends the player back to the title page
 * (rq-b8xq: once, during an automated session, the page went back to the
 * title page as Elior walked north out of the shed).
 */
import { test, expect, type Page } from '@playwright/test'
import { ACT1_GOLDEN_PATH } from '../src/act1/Act1GoldenPath'

/** The golden path up to and including the walk north out of the Abandoned Shed. */
const THROUGH_THE_SHED = ACT1_GOLDEN_PATH.slice(
  0,
  ACT1_GOLDEN_PATH.indexOf('take magnet') + 2,
)

/** The app's game store, as much of it as this test reads. */
interface AppRoot extends Element {
  __vue_app__?: {
    config: {
      globalProperties: {
        $pinia: {
          state: {
            value: {
              game: { turns: { command: string | null; room: string }[] }
            }
          }
        }
      }
    }
  }
}

/** The command and room of the game's newest turn. */
async function newestTurn(
  page: Page,
): Promise<{ command: string | null; room: string } | null> {
  return page.evaluate(() => {
    const root: AppRoot | null = document.querySelector('#app')
    const turn =
      root?.__vue_app__?.config.globalProperties.$pinia.state.value.game.turns.at(
        -1,
      )
    return turn ? { command: turn.command, room: turn.room } : null
  })
}

/** Close any chapter page that stands in front of the command box. */
async function clearPages(page: Page): Promise<void> {
  const chapterButton = page.locator('.lq-chapter-button')
  while (await chapterButton.isVisible()) await chapterButton.click()
}

/** Type one command into the command box and wait until it is the game's newest turn. */
async function type(page: Page, command: string): Promise<void> {
  await clearPages(page)
  const input = page.getByLabel('Command')
  await input.fill(command, { timeout: 5_000 })
  await input.press('Enter')
  await expect
    .poll(async () => (await newestTurn(page))?.command, { message: command })
    .toBe(command)
}

test('typing Act I through the Abandoned Shed and north out of it never reloads the page', async ({
  page,
}): Promise<void> => {
  test.setTimeout(60_000)
  let loads = 0
  page.on('load', () => loads++)

  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await clearPages(page)
  await page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
    .click()

  for (const command of THROUGH_THE_SHED) {
    expect(loads, `the page reloaded before "${command}"`).toBe(1)
    await type(page, command)
  }

  expect((await newestTurn(page))?.room).toBe('Village Well')
  expect(loads, 'the page loaded once, at the start').toBe(1)
  await expect(
    page.getByRole('button', { name: 'Start', exact: true }),
  ).toHaveCount(0)
})
