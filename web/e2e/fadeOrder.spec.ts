import { test, expect, type Page } from './fixtures'

/**
 * Lines on the picture fade away top first in each column (rq-8clk): on the
 * laptop stage a line going never moves the lines still showing, in the
 * speech column or the narrator's cards, also when a short line below would
 * be read before a long one above it.
 */

/** Type a command into the actions bar (or the phone's sheet). */
async function enter(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  const type = page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
  if (await type.isVisible()) await type.click()
  else if (!(await input.isVisible()))
    await page.getByRole('button', { name: 'Type a command' }).click()
  await input.fill(command)
  await input.press('Enter')
}

/**
 * Watch every fading line on the picture until all are gone (or `ms` has
 * passed): the furthest any moved while it still showed, in px, and how many
 * are left.
 */
function watchFades(
  page: Page,
  ms: number,
): Promise<{ moved: number; left: number }> {
  return page.evaluate(
    (limit) =>
      new Promise<{ moved: number; left: number }>((resolve) => {
        const lines = (): HTMLElement[] =>
          Array.from(
            document.querySelectorAll<HTMLElement>(
              '.lq-paper-content :is(.lq-bubble, .lq-cl), .lq-thread .lq-ln',
            ),
          )
        const first = new Map<HTMLElement, number>()
        let furthest = 0
        const started = performance.now()
        const look = (): void => {
          const showing = lines().filter(
            (el) => el.dataset.fade && el.dataset.fade !== 'gone',
          )
          for (const el of showing) {
            const top = el.getBoundingClientRect().top
            const was = first.get(el)
            if (was === undefined) first.set(el, top)
            else furthest = Math.max(furthest, Math.abs(top - was))
          }
          if (showing.length === 0 || performance.now() - started > limit)
            resolve({ moved: Math.round(furthest), left: showing.length })
          else requestAnimationFrame(look)
        }
        look()
      }),
    ms,
  )
}

test('a line fading away never moves the lines still showing', async ({
  page,
}): Promise<void> => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await enter(page, 'talk to voice')
  await enter(page, 'talk to grandmother')
  // Every line of the talk at once: short ones would be read before long ones above them.
  const said = page.getByTestId('speech-line')
  await expect(said.first()).toBeVisible({ timeout: 20_000 })
  await said.first().locator('.lq-line').click()
  // A pointer resting on a line holds its fade.
  await page.mouse.move(1, 1)
  const { moved, left } = await watchFades(page, 60_000)
  expect(left).toBe(0)
  // Within a pixel: a line's top may round differently as the page settles.
  expect(moved).toBeLessThanOrEqual(1)
})
