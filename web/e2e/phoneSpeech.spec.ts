import { test, expect, type Page } from '@playwright/test'

/**
 * The conversation on the picture on a phone: a line taller than the room
 * between the plate and the narration paper is never cut through its top, so
 * its speaker and first words can be read (rq-gw9m).
 */

/** Type a command on the phone stage: the bar's keyboard button opens the sheet into typing. */
async function enter(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  if (!(await input.isVisible()))
    await page.getByRole('button', { name: 'Type a command' }).click()
  await input.fill(command)
  await input.press('Enter')
}

/** Whether the centre of the element is what the player sees there (not clipped or covered). */
async function seenAtCentre(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel)
    if (!element) return false
    const box = element.getBoundingClientRect()
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    )
    return hit !== null && element.contains(hit)
  }, selector)
}

test('on a phone the newest speech line is never cut through its speaker and first words', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()

  await enter(page, 'talk to voice')
  await expect(
    page.getByRole('region', { name: 'Current location' }),
  ).toContainText("Elior's Cottage")
  // Her greeting comes a paragraph at a time; the third is far taller than
  // the conversation's room once the paper takes half the stage.
  await enter(page, 'talk to grandmother')
  const lines = page.getByTestId('speech-line')
  await expect(lines).toHaveCount(3)
  await expect(lines.nth(2)).toContainText("If you're going out")

  // Its speaker and first words are seen, not clipped away or covered (the
  // next paragraph waits several seconds of reading time).
  await expect
    .poll(
      () =>
        seenAtCentre(
          page,
          '[data-testid="speech-line"]:nth-child(3) .lq-line-name',
        ),
      {
        timeout: 2_000,
      },
    )
    .toBe(true)
})
