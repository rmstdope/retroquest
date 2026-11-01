import { test, expect, type Page } from '@playwright/test'

/**
 * The conversation on the picture: a line taller than the room between the
 * plate and the narration paper is never cut through its top on a phone, so
 * its speaker and first words can be read, and when more lines are said than
 * fit, the newest stays at the foot while the oldest leave at the top
 * (rq-gw9m).
 */

/**
 * Type a command: the laptop's actions have a Type button; on the phone stage
 * the bar's keyboard button opens the sheet into typing.
 */
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

test('on a laptop the newest line stays at the foot when more lines are said than fit', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()

  await enter(page, 'talk to voice')
  await expect(
    page.getByRole('region', { name: 'Current location' }),
  ).toContainText("Elior's Cottage")
  // Her four paragraphs each fit, but together they overflow the thread.
  await enter(page, 'talk to grandmother')
  const lines = page.getByTestId('speech-line')
  await expect(lines).toHaveCount(4, { timeout: 30_000 })

  const newest = '[data-testid="speech-line"]:nth-child(4)'
  await expect
    .poll(() => seenAtCentre(page, `${newest} .lq-line-name`))
    .toBe(true)
  await expect.poll(() => seenAtCentre(page, newest)).toBe(true)
  // The oldest has left at the top.
  expect(
    await seenAtCentre(page, '[data-testid="speech-line"]:nth-child(1)'),
  ).toBe(false)
})
