import { test, expect, type Page } from './fixtures'

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

/** Push a turn that taught a spell and started a quest, as the store records it. */
async function pushSpell(page: Page): Promise<void> {
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
      text: 'She smiles.\nYou have learned [spell_name]revive[/spell_name].',
      room: 'Cottage',
      description: null,
      gained: [],
      lost: [],
      arrival: null,
      spells: [{ name: 'Revive', text: 'Calls a thing back.' }],
      quests: [
        { kind: 'new', name: 'Magic for real', main: false, text: 'Go on.' },
      ],
    })
  })
}

const middle = (page: Page) => page.getByTestId('arrival-on-picture')

test.describe('a learned spell told in the middle of the picture', () => {
  test('comes before the quest news, a click clearing it, and the card keeps no learned line', async ({
    page,
  }) => {
    await startAct1(page)
    await pushSpell(page)

    await expect(middle(page).getByTestId('spell-seal').last()).toHaveText('✦')
    await expect(middle(page).locator('.lq-news-kicker').last()).toHaveText(
      'New spell',
    )
    await expect(middle(page).locator('.lq-news-name').last()).toHaveText(
      'Revive',
    )
    await expect(middle(page).getByText('Calls a thing back.')).toBeVisible()
    await expect(
      middle(page).getByText('Click or press Enter to continue').last(),
    ).toBeVisible()

    await middle(page).click({ position: { x: 600, y: 300 } })
    await expect(middle(page).locator('.lq-news-kicker').last()).toHaveText(
      'New side quest',
    )
    await page.keyboard.press('Enter')
    await expect(middle(page).locator('.lq-news-kicker')).toHaveCount(0)

    await expect(
      page.locator('.lq-story').getByText('She smiles.'),
    ).toBeVisible()
    await expect(page.locator('.lq-story')).not.toContainText(
      'You have learned',
    )

    // Story so far keeps the full record, learned line included.
    await page.getByRole('button', { name: /Story so far/ }).click()
    await expect(
      page.getByRole('complementary', { name: 'Story so far drawer' }),
    ).toContainText('You have learned revive.')
  })

  test('is told on a phone too, with "Tap to continue"', async ({ page }) => {
    await startAct1(page, 390, 844)
    await pushSpell(page)
    await expect(middle(page).locator('.lq-news-name').last()).toHaveText(
      'Revive',
    )
    await expect(middle(page).getByText('Tap to continue').last()).toBeVisible()
  })
})
