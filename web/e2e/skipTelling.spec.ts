/**
 * The suite's own `skipTelling` helper (rq-aq22): most specs only need a
 * telling out of the way, so it does not sit out the hold to skip.
 */
import { test, expect, skipTelling } from './fixtures'
import { HOLD_TO_SKIP_MS } from '../src/composables/useHoldToSkip'

test('skipTelling shows the rest without waiting the hold out', async ({
  page,
}): Promise<void> => {
  // A timer as long as the hold never comes due by itself here, so only a
  // helper that does not wait for it can skip.
  await page.addInitScript((hold) => {
    const own = window.setTimeout.bind(window)
    window.setTimeout = ((handler: TimerHandler, ms?: number) =>
      own(handler, ms === hold ? 600_000 : ms)) as typeof window.setTimeout
  }, HOLD_TO_SKIP_MS)
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  const line = page
    .getByTestId('arrival-on-picture')
    .locator('.lq-arrival-line')
  await expect(line).toBeVisible()
  const before = await page.evaluateHandle(() => window.setTimeout)

  await skipTelling(page)

  await expect(line).toHaveCount(0, { timeout: 1_000 })
  // The page's own timers are back as they were.
  expect(await before.evaluate((own) => own === window.setTimeout)).toBe(true)
})
