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

test('on a short laptop window the plate folds so the newest line and the ✕ have room (rq-7cv0)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1000, height: 613 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()

  await enter(page, 'talk to voice')
  await enter(page, 'talk to grandmother')
  const plate = page.locator('.lq-phone-plate')
  await expect(plate).toHaveClass(/lq-plate-folded/)
  await expect(plate.locator('.lq-label')).toBeHidden()
  const rows = await plate.evaluate((el) => el.getBoundingClientRect().height)
  expect(rows).toBeLessThan(60)

  // The ✕ is clear of the right portrait, and the portrait is not under the plate.
  const boxes = await page.evaluate(() => {
    const rect = (sel: string): DOMRect | undefined =>
      document.querySelector(sel)?.getBoundingClientRect()
    return {
      clear: rect('.lq-clear'),
      portrait: rect('.lq-sp-right'),
      plate: rect('.lq-phone-plate'),
    }
  })
  expect(boxes.clear!.bottom).toBeLessThanOrEqual(boxes.portrait!.top)
  expect(boxes.portrait!.top).toBeGreaterThanOrEqual(boxes.plate!.bottom)

  // The newest line shows its speaker and first line whole.
  const newest = page.locator('[data-testid="speech-line"]').last()
  await expect
    .poll(
      () =>
        seenAtCentre(
          page,
          '[data-testid="speech-line"]:last-child .lq-line-name',
        ),
      {
        timeout: 2_000,
      },
    )
    .toBe(true)
  await expect(newest).toBeVisible()

  await page.getByRole('button', { name: 'Clear the conversation' }).click()
  await expect(plate).not.toHaveClass(/lq-plate-folded/)
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
