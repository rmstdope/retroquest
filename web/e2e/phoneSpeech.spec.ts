import { test, expect, type Page } from './fixtures'

/**
 * The conversation on the picture: a line taller than the room between the
 * plate and the Hide is never cut through its top on a phone, so
 * its speaker and first words can be read, and when more lines are said than
 * fit, the newest stays at the foot while the oldest leave at the top
 * (rq-gw9m); on a phone each new line comes whole into view (rq-r7ct).
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
    const element = Array.from(document.querySelectorAll(sel)).at(-1)
    if (!element) return false
    const box = element.getBoundingClientRect()
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    )
    return hit !== null && element.contains(hit)
  }, selector)
}

test('on a phone each new line comes whole into view, pushing the older ones up (rq-r7ct)', async ({
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
  // Her greeting comes a paragraph at a time, more than the column holds.
  await enter(page, 'talk to grandmother')
  const lines = page.getByTestId('speech-line')
  await expect(lines).toHaveCount(3)
  await expect(lines.nth(2)).toContainText("If you're going out")
  // The newest is whole inside the story pane, from its top to its foot.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const story = document.querySelector('.lq-one-column .lq-story')!
          const pane = story.getBoundingClientRect()
          const rows = document.querySelectorAll('[data-testid="speech-line"]')
          const at = rows[rows.length - 1].getBoundingClientRect()
          return at.top >= pane.top - 1 && at.bottom <= pane.bottom + 1
        }),
      { timeout: 2_000 },
    )
    .toBe(true)
})

test('on a laptop the newest line stays at the foot when more lines are said than fit', async ({
  page,
}): Promise<void> => {
  // The thread reaches down to the actions (no story band under it), so a lower window is needed to overflow it.
  await page.setViewportSize({ width: 1280, height: 580 })
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

  // Elior answers her, which adds more lines than the thread can hold.
  await enter(page, 'say hello to grandmother')
  await expect(lines.last()).toContainText('hello', { timeout: 30_000 })
  const newest = '[data-testid="speech-line"]:last-child .lq-line'
  await expect.poll(() => seenAtCentre(page, newest)).toBe(true)
  // The oldest has left at the top.
  expect(
    await seenAtCentre(
      page,
      '[data-testid="speech-line"]:nth-child(1) .lq-line',
    ),
  ).toBe(false)
})

test('on a low window the column lies between the plate and the Hide, with the newest line whole (rq-7cv0)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1000, height: 520 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()

  await enter(page, 'talk to voice')
  await enter(page, 'talk to grandmother')
  const plate = (await page.locator('.lq-phone-plate').boundingBox())!
  const column = (await page.locator('.lq-one-column').boundingBox())!
  const hide = (await page
    .getByRole('button', { name: '▾ Hide' })
    .boundingBox())!
  expect(column.y).toBeGreaterThanOrEqual(plate.y + plate.height)
  expect(column.y + column.height).toBeLessThanOrEqual(hide.y)
  await expect(page.getByTestId('speech-line').first()).toBeVisible()
})

test('on an upright phone the plate does not fold (rq-7cv0)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await enter(page, 'talk to voice')
  await enter(page, 'talk to grandmother')
  await expect(page.getByTestId('speech-line').first()).toBeVisible()
  await expect(page.locator('.lq-phone-plate')).not.toHaveClass(
    /lq-plate-folded/,
  )
})
