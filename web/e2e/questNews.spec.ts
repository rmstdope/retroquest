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

/** A checklist quest's text, as Preparing for the road starts out. */
const CHECKLIST =
  '[character_name]Mira[/character_name] has tasked you with preparing for your journey. ' +
  'She says you will need: \n' +
  '[pending] * Warm clothing[/pending]\n' +
  '[pending] * Magical protection[/pending]\n' +
  '[pending] * Food for the road (any four kinds: bread, apple, egg, carrot or berries)[/pending]'

/** Push a turn with quest news, and any spells it taught, as the engine reports them. */
async function pushNews(
  page: Page,
  quests: unknown[],
  spells: unknown[] = [],
): Promise<void> {
  await page.evaluate(
    ({ quests, spells }) => {
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
        spells,
        quests,
      })
    },
    { quests, spells },
  )
}

const middle = (page: Page) => page.getByTestId('arrival-on-picture')

test.describe('PIC-5: quest and spell news told in the middle of the picture', () => {
  for (const [width, height] of [
    [1512, 813],
    [390, 844],
  ]) {
    test(`tells a learned spell, then wraps a checklist quest's intro and needs inside the picture at ${width} wide`, async ({
      page,
    }) => {
      await startAct1(page, width, height)
      await pushNews(
        page,
        [
          {
            kind: 'new',
            name: 'Preparing for the road',
            main: false,
            text: CHECKLIST,
          },
        ],
        [{ name: 'Revive', text: 'Calls a thing back.' }],
      )
      // One piece at a time: the spell alone, and a click brings the quest.
      await expect(middle(page).locator('.lq-news-name')).toHaveText(['Revive'])
      await middle(page).click({ position: { x: 300, y: 300 } })
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

  // Heights at which a page holds the short need alone, under the one-row
  // room plate (about 94 px lower than under the old room card), and with no
  // top bar (about 70 px lower again).
  for (const [width, height] of [
    [850, 670],
    [390, 570],
  ]) {
    test(`keeps one left edge for a checklist split over pages at ${width} wide`, async ({
      page,
    }) => {
      await startAct1(page, width, height)
      const needs = [
        'Warm clothing, a coat of thick wool that keeps out the wind',
        'Magical protection against whatever waits on the road ahead',
        'Food for the road (any four kinds: bread, apple, egg, carrot or berries)',
        'Sturdy footwear for the long road',
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
      // Each page's list by its text, so a page seen twice counts once.
      let alone = ''
      const lefts: Record<string, number> = {}
      const list = box.locator('.lq-quest-checklist')
      // The page's list in one read: the card can go between two reads (the
      // last page ends the news), and a read of a list that is gone waits on
      // it until the test times out (rq-z206).
      const read = (): Promise<{
        text: string
        items: number
        left: number
      } | null> =>
        list.evaluateAll((lists) => {
          const first = lists[0] as HTMLElement | undefined
          return first
            ? {
                text: first.innerText,
                items: first.querySelectorAll('li').length,
                left: first.getBoundingClientRect().x,
              }
            : null
        })
      for (let turn = 0; turn < 14; turn++) {
        const shown = await read()
        if (!shown) break
        const first = shown.text
        if (shown.items === 1) alone = first
        lefts[first] = Math.round(shown.left)
        // Enter, with no control focused, goes on a page; the last ends the
        // news and takes the card away.
        await page.evaluate(() =>
          (document.activeElement as HTMLElement | null)?.blur(),
        )
        await page.keyboard.press('Enter')
        await expect
          .poll(async () => (await read())?.text ?? '')
          .not.toBe(first)
      }
      expect(Object.keys(lefts).length).toBeGreaterThan(1)
      // A page holds the short need alone: the case that shrank the line.
      expect(alone).toMatch(/Magic$/)
      expect(new Set(Object.values(lefts)).size).toBe(1)
    })
  }
})
