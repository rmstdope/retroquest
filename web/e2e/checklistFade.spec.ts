import { test, expect, type Locator, type Page } from './fixtures'

/**
 * In a checklist quest's log, what is still to do stands out and what is done
 * fades (rq-3t6a): wherever the game shows a checklist, a ticked need shows
 * fainter than an open one.
 */

interface VueHost {
  __vue_app__: {
    config: {
      globalProperties: {
        $pinia: { state: { value: { game: Record<string, unknown> } } }
      }
    }
  }
}

/** Open the game and close the opening chapter page and the first arrival. */
async function startAct1(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  // The title's opening is skipped by the suite's reduced motion; this spec needs the motion back.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('.lq-chapter-button').click()
  await page
    .getByTestId('arrival-on-picture')
    .click({ position: { x: 300, y: 300 } })
}

/** Preparing for the road, with its first need met. */
const CHECKLIST =
  '[character_name]Mira[/character_name] has tasked you with preparing for your journey. ' +
  'She says you will need: \n' +
  '[success] * Warm clothing[/success]\n' +
  '[pending] * Magical protection[/pending]'

/** How strongly an item's text shows: its opacity and its colour's contrast. */
interface Strength {
  /** Its own opacity times that of its ancestors inside the list (the list's own fade-in dims every item alike, so it is left out). */
  opacity: number
  /** The contrast ratio (WCAG) of its colour against the nearest painted background, the page's at the latest. */
  contrast: number
}

/** How strongly `item`'s text shows. */
async function strength(item: Locator): Promise<Strength> {
  return item.evaluate((el) => {
    // `rgb(r, g, b)` in 0–255, or `color(srgb r g b / a)` in 0–1.
    const rgb = (css: string): number[] => {
      const scale = css.startsWith('color(') ? 255 : 1
      return (css.match(/[\d.]+/g) ?? [])
        .slice(0, 3)
        .map((v) => Number(v) * scale)
    }
    let bg = rgb(getComputedStyle(document.body).backgroundColor)
    for (let e: Element | null = el; e; e = e.parentElement) {
      const paint = getComputedStyle(e).backgroundColor
      if (!/rgba\(.*,\s*0\)$|transparent/.test(paint)) {
        bg = rgb(paint)
        break
      }
    }
    let opacity = 1
    for (
      let e: Element | null = el;
      e && e.tagName !== 'UL';
      e = e.parentElement
    )
      opacity *= Number(getComputedStyle(e).opacity)
    const lum = (c: number[]): number => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const fg = rgb(getComputedStyle(el).color)
    const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a)
    return { opacity, contrast: (hi + 0.05) / (lo + 0.05) }
  })
}

/** Expect the done need to read fainter than the open one: no stronger in either way, and weaker in one. */
async function expectDoneFaded(done: Locator, open: Locator): Promise<void> {
  await expect(done).toBeVisible()
  await expect(open).toBeVisible()
  const [d, o] = [await strength(done), await strength(open)]
  expect(d.opacity).toBeLessThanOrEqual(o.opacity)
  expect(d.contrast).toBeLessThanOrEqual(o.contrast)
  expect(d.opacity < o.opacity || d.contrast < o.contrast).toBe(true)
}

test.describe('a checklist fades what is done (rq-3t6a)', () => {
  test('in the quest log', async ({ page }) => {
    await startAct1(page)
    await page.evaluate((intro) => {
      const app = (document.querySelector('#app') as unknown as VueHost)
        .__vue_app__
      const game = app.config.globalProperties.$pinia.state.value.game
      game.activeQuests = [
        {
          name: 'Preparing for the road',
          main: false,
          done: false,
          details: {
            kind: 'checklist',
            intro,
            items: [
              { text: 'Warm clothing', done: true },
              { text: 'Magical protection', done: false },
            ],
          },
        },
      ]
      game.shownQuest = 'Preparing for the road'
    }, 'Mira has tasked you with preparing for your journey.')
    const rows = page.locator('.lq-checks .lq-check')
    await expectDoneFaded(rows.nth(0), rows.nth(1))
  })

  test('in the quest news and the story turn', async ({ page }) => {
    await startAct1(page)
    await page.evaluate((text) => {
      const app = (document.querySelector('#app') as unknown as VueHost)
        .__vue_app__
      const game = app.config.globalProperties.$pinia.state.value.game
      ;(game.turns as unknown[]).push({
        id: 997,
        command: 'look',
        text,
        room: 'Cottage',
        description: null,
        gained: [],
        lost: [],
        arrival: null,
        quests: [
          {
            kind: 'updated',
            name: 'Preparing for the road',
            main: false,
            text,
          },
        ],
      })
    }, CHECKLIST)
    // The news is told in the middle of the picture first.
    const news = page
      .getByTestId('arrival-on-picture')
      .locator('.lq-quest-checklist')
      .last()
    await expectDoneFaded(
      news.locator('.lq-check-done'),
      news.locator('.lq-check-pending'),
    )
    await page.keyboard.press('Escape')
    const turn = page.locator('.lq-block-checklist').last()
    await expectDoneFaded(
      turn.locator('.lq-check-done'),
      turn.locator('.lq-check-pending'),
    )
  })
})
