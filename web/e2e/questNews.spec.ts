import { test, expect, type Page } from '@playwright/test'

/** Open the game and close the opening chapter page and the first arrival. */
async function startAct1(
  page: Page,
  width = 1280,
  height = 800,
): Promise<void> {
  await page.setViewportSize({ width, height })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page
    .getByTestId('arrival-on-picture')
    .click({ position: { x: 300, y: 300 } })
}

/** Push a turn with two pieces of quest news, as the engine reports them. */
async function pushNews(page: Page): Promise<void> {
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
      id: 998,
      command: 'talk to grandmother',
      text: 'She smiles.',
      room: 'Cottage',
      description: null,
      gained: [],
      lost: [],
      arrival: null,
      quests: [
        {
          kind: 'completed',
          name: 'Hint of Magic',
          main: false,
          text: 'It stayed.',
          progress: { completed: 1, total: 11 },
        },
        { kind: 'new', name: 'Magic for real', main: false, text: 'Go on.' },
      ],
    })
  })
}

const middle = (page: Page) => page.getByTestId('arrival-on-picture')

test.describe('quest news told in the middle of the picture', () => {
  test('comes one piece after the other, a click clearing each, and leaves no line on the left', async ({
    page,
  }) => {
    await startAct1(page)
    await pushNews(page)

    await expect(middle(page).locator('.lq-news-kicker').last()).toHaveText(
      'Side quest complete · 1 of 11',
    )
    await expect(middle(page).locator('.lq-news-name').last()).toHaveText(
      'Hint of Magic',
    )
    await expect(
      middle(page).getByText('Click or press Enter to continue').last(),
    ).toBeVisible()
    await expect(middle(page).getByRole('button')).toHaveCount(0)

    await middle(page).click({ position: { x: 600, y: 300 } })
    await expect(middle(page).locator('.lq-news-kicker').last()).toHaveText(
      'New side quest',
    )
    await page.keyboard.press('Enter')
    await expect(middle(page).locator('.lq-news-kicker')).toHaveCount(0)

    await expect(page.getByTestId('news-line')).toHaveCount(0)
  })

  test('Escape ends all the news at once', async ({ page }) => {
    await startAct1(page)
    await pushNews(page)
    await expect(middle(page).locator('.lq-news-kicker').last()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(middle(page).locator('.lq-news-kicker')).toHaveCount(0)
    await expect(page.getByTestId('news-line')).toHaveCount(0)
  })

  test('is told on a phone too, with "Tap to continue"', async ({ page }) => {
    await startAct1(page, 390, 844)
    await pushNews(page)
    await expect(middle(page).locator('.lq-news-name').last()).toHaveText(
      'Hint of Magic',
    )
    await expect(middle(page).getByText('Tap to continue').last()).toBeVisible()
  })
})
