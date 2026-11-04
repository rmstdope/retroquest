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

/** A checklist quest's text, as Preparing for the road starts out. */
const CHECKLIST =
  '[character_name]Mira[/character_name] has tasked you with preparing for your journey. ' +
  'She says you will need: \n' +
  '[pending] * Warm clothing[/pending]\n' +
  '[pending] * Magical protection[/pending]\n' +
  '[pending] * Food for the road (any four kinds: bread, apple, egg, carrot, berries or fish)[/pending]'

/** Push a turn with quest news, as the engine reports them: by default a completed and a new quest. */
async function pushNews(
  page: Page,
  quests: unknown[] = [
    {
      kind: 'completed',
      name: 'Hint of magic',
      main: false,
      text: 'It stayed.',
      progress: { completed: 1, total: 11 },
    },
    { kind: 'new', name: 'Magic for real', main: false, text: 'Go on.' },
  ],
): Promise<void> {
  await page.evaluate((quests) => {
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
      quests,
    })
  }, quests)
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
      'Hint of magic',
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
      'Hint of magic',
    )
    await expect(middle(page).getByText('Tap to continue').last()).toBeVisible()
  })

  for (const [width, height] of [
    [1512, 813],
    [390, 844],
  ]) {
    test(`wraps a checklist quest's intro and needs inside the picture at ${width} wide`, async ({
      page,
    }) => {
      await startAct1(page, width, height)
      await pushNews(page, [
        {
          kind: 'new',
          name: 'Preparing for the road',
          main: false,
          text: CHECKLIST,
        },
      ])
      await expect(middle(page).locator('.lq-news-name').last()).toHaveText(
        'Preparing for the road',
      )
      const box = middle(page).locator('.lq-arrival-text').last()
      await expect(box).toBeVisible()
      await expect(box.locator('.lq-quest-checklist li')).toHaveCount(3)
      const overflow = await box.evaluate((text) => {
        // While the narrator speaks, the read-along puts each word in a span
        // (wrapWords); lay the card out as it is then.
        text.querySelectorAll('.lq-quest-para, li').forEach((el) => {
          el.innerHTML = el.innerHTML.replace(
            /([^\s<>]+)(?![^<]*>)/g,
            '<span class="lq-w">$1</span>',
          )
        })
        const edge = text.getBoundingClientRect()
        return [...text.querySelectorAll('.lq-quest-para, li')]
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.left < edge.left - 1 || r.right > edge.right + 1)
          .map((r) => `${Math.round(r.left)}..${Math.round(r.right)}`)
      })
      expect(overflow).toEqual([])
    })
  }

  for (const [width, height] of [
    [1440, 560],
    [390, 600],
  ]) {
    test(`keeps one left edge for a checklist split over pages at ${width} wide`, async ({
      page,
    }) => {
      await startAct1(page, width, height)
      const needs = [
        'Warm clothing, a coat of thick wool that keeps out the wind',
        'Magical protection against whatever waits on the road ahead',
        'Food for the road (any four kinds: bread, apple, egg, carrot, berries or fish)',
        'Magic',
      ]
      await pushNews(page, [
        {
          kind: 'new',
          name: 'Preparing for the road',
          main: false,
          text:
            'Mira has tasked you with preparing for your journey. She says you will need: \n' +
            needs.map((n) => `[pending] * ${n}[/pending]`).join('\n'),
        },
      ])
      const box = middle(page).locator('.lq-arrival-text').last()
      await expect(box.locator('.lq-quest-checklist')).toBeVisible()
      // Each page's list by its first line, so a page seen twice counts once.
      const lefts: Record<string, number> = {}
      for (let turn = 0; turn < 14; turn++) {
        const list = box.locator('.lq-quest-checklist')
        if ((await list.count()) === 0) break
        const first = await list.first().innerText({ timeout: 1500 })
        const bounds = await list.first().boundingBox({ timeout: 1500 })
        lefts[first] = Math.round(bounds?.x ?? -1)
        // The last click ends the news and takes the card away.
        await middle(page)
          .click({ position: { x: 20, y: 20 }, timeout: 1500 })
          .catch(() => undefined)
      }
      expect(Object.keys(lefts).length).toBeGreaterThan(1)
      expect(Object.keys(lefts).some((text) => text.endsWith('Magic'))).toBe(
        true,
      )
      expect(new Set(Object.values(lefts)).size).toBe(1)
    })
  }
})
