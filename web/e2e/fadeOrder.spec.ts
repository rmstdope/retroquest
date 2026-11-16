import { test, expect, type Page, enterCommand as enter } from './fixtures'

/**
 * Lines on the picture fade away top first in each column (rq-8clk): a line
 * going never moves the lines still showing, in the speech column or the
 * narrator's cards of the laptop stage, or the one column of a phone
 * (rq-r7ct), also when a short line below would be read before a long one
 * above it.
 */

/**
 * Watch every fading line on the picture, frame by frame as painted, until
 * all are gone (or `ms` has passed): how many it watched, the furthest any
 * line's words moved while it still showed, in px, and how many are left.
 */
function watchFades(
  page: Page,
  ms: number,
): Promise<{ watched: number; moved: number; left: number }> {
  return page.evaluate(
    (limit) =>
      new Promise<{ watched: number; moved: number; left: number }>(
        (resolve) => {
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
              // The words: a speaker's name drawn above them as a run's head steps down is not a move.
              const top = (
                el.querySelector('.lq-line') ?? el
              ).getBoundingClientRect().top
              const was = first.get(el)
              if (was === undefined) first.set(el, top)
              else furthest = Math.max(furthest, Math.abs(top - was))
            }
            if (showing.length === 0 || performance.now() - started > limit)
              resolve({
                watched: first.size,
                moved: Math.round(furthest),
                left: showing.length,
              })
            // Once the frame is painted: what a frame's resize observers put
            // right before it is drawn never reaches the screen.
            else requestAnimationFrame(() => setTimeout(look, 0))
          }
          look()
        },
      ),
    ms,
  )
}

/** Wait until the lines on the picture have held still for ten painted frames. */
function settled(page: Page): Promise<void> {
  return page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = ''
        let still = 0
        const look = (): void => {
          const now = Array.from(
            document.querySelectorAll(
              '.lq-paper-content :is(.lq-bubble, .lq-cl), .lq-thread .lq-ln',
            ),
            (el) => Math.round(el.getBoundingClientRect().top),
          ).join()
          still = now === last ? still + 1 : 0
          last = now
          if (still >= 10) resolve()
          else requestAnimationFrame(() => setTimeout(look, 0))
        }
        look()
      }),
  )
}

for (const [name, width, height] of [
  ['the laptop stage', 1440, 900],
  ['a phone (rq-r7ct)', 390, 844],
] as const)
  test(`on ${name} a line fading away never moves the lines still showing`, async ({
    page,
  }): Promise<void> => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height })
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
    // The lines just shown push the older ones up and settle: that is not a fade.
    await settled(page)
    const { watched, moved, left } = await watchFades(page, 60_000)
    expect(watched).toBeGreaterThan(1)
    expect(left).toBe(0)
    // Within a pixel: a line's top may round differently as the page settles.
    expect(moved).toBeLessThanOrEqual(1)
  })
