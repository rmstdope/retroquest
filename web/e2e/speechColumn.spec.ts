import { test, expect, type Page } from '@playwright/test'

/**
 * Speech is a chat-style column at the right of the picture (rq-c15r.2):
 * small round portraits of a fixed size, Elior at the left of the column,
 * and, on a narrow laptop window, no overlap with the narrator's cards.
 */

/** Type a command into the actions bar. */
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

for (const width of [1440, 1060]) {
  test(`at ${width}px the speech column holds 46px portraits and clears the cards`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    await enter(page, 'talk to voice')
    await enter(page, 'talk to grandmother')
    await enter(page, 'say hello to grandmother')

    const portraits = page.locator('.lq-thread [data-testid="portrait"]')
    await expect(portraits.first()).toBeVisible()
    for (const box of await portraits.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().width),
    ))
      expect(Math.round(box)).toBe(46)

    await expect(page.locator('.lq-line-left .lq-line-name')).toHaveText(
      'Elior',
    )
    const edges = await page.evaluate(() => {
      const right = (sel: string): number | undefined =>
        document.querySelector(sel)?.getBoundingClientRect().right
      const left = (sel: string): number | undefined =>
        document.querySelector(sel)?.getBoundingClientRect().left
      return { cards: right('.lq-cards'), thread: left('.lq-thread') }
    })
    expect(edges.cards!).toBeLessThanOrEqual(edges.thread!)
  })
}

test('when a run fills the column its name and portrait step down to the first line showing', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 580 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await enter(page, 'talk to voice')
  await enter(page, 'talk to grandmother')
  await expect(page.getByTestId('speech-line')).toHaveCount(4, {
    timeout: 30_000,
  })
  // Elior's reply overflows the column, so Grandmother's first line leaves.
  await enter(page, 'say hello to grandmother')
  await expect(page.getByTestId('speech-line').last()).toContainText('hello', {
    timeout: 30_000,
  })

  // Every run on the picture says whose it is, inside the thread.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const thread = document.querySelector('.lq-thread')!
        const box = thread.getBoundingClientRect()
        const name = thread.querySelector('.lq-line-name')
        if (!name) return false
        const at = name.getBoundingClientRect()
        const rows = Array.from(thread.querySelectorAll('.lq-ln'))
        const head = rows.find((row) => row.querySelector('.lq-line-name'))!
        return (
          at.top >= box.top &&
          head.querySelector('[data-testid="portrait"]') !== null &&
          at.bottom <= box.bottom
        )
      }),
    )
    .toBe(true)
})

test('a name too long for the room wraps between words and stays inside the column', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1060, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await enter(page, 'talk to voice')
  await enter(page, 'talk to grandmother')
  const name = page.locator('.lq-thread .lq-line-name').first()
  await expect(name).toHaveText('Grandmother')

  // At a laptop width the name is one line, whole.
  const oneLine = await name.evaluate(
    (el) => el.getBoundingClientRect().height < 24,
  )
  expect(oneLine).toBe(true)

  // The longest name in a narrow column at the largest text size: every
  // word stays whole on one line and the label stays inside the column.
  const result = await page.evaluate(() => {
    const thread = document.querySelector<HTMLElement>('.lq-thread')!
    const label = thread.querySelector<HTMLElement>('.lq-line-name')!
    thread.style.width = '170px'
    thread.style.setProperty('--lq-text-scale', '1.6')
    label.textContent = ''
    const words = 'Master Merchant Aldric'.split(' ')
    const spans = words.map((word, i) => {
      const span = document.createElement('span')
      span.textContent = word
      label.append(span)
      if (i < words.length - 1) label.append(' ')
      return span
    })
    const box = thread.getBoundingClientRect()
    const at = label.getBoundingClientRect()
    return {
      wholeWords: spans.every((span) => span.getClientRects().length === 1),
      lines: new Set(
        spans.map((span) => Math.round(span.getBoundingClientRect().top)),
      ).size,
      inside: at.left >= box.left - 1 && at.right <= box.right + 1,
    }
  })
  expect(result.wholeWords).toBe(true)
  expect(result.lines).toBeGreaterThan(1)
  expect(result.inside).toBe(true)
})

test('on a phone a short conversation rests at the foot and a two-line name clears the row above', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await enter(page, 'talk to voice')
  await enter(page, 'talk to grandmother')
  await expect(page.getByTestId('speech-line').first()).toBeVisible({
    timeout: 30_000,
  })

  // The rows rest at the foot of the thread while they fit.
  const rest = await page.evaluate(() => {
    const thread = document.querySelector('.lq-thread')!
    const row = thread.querySelector('.lq-ln')!
    return (
      thread.getBoundingClientRect().bottom - row.getBoundingClientRect().bottom
    )
  })
  expect(rest).toBeLessThanOrEqual(14)

  // Elior answers: his run follows Grandmother's. At the largest text size
  // and a narrow column his name takes two lines, above his words and below
  // the row before.
  await enter(page, 'say hello to grandmother')
  await expect(page.locator('.lq-line-left .lq-line-name')).toHaveText(
    'Elior',
    { timeout: 30_000 },
  )
  const clear = await page.evaluate(() => {
    const thread = document.querySelector<HTMLElement>('.lq-thread')!
    thread.style.width = '220px'
    thread.style.setProperty('--lq-text-scale', '1.18')
    const row = thread.querySelector('.lq-line-left')!
    const label = row.querySelector<HTMLElement>('.lq-line-name')!
    label.textContent = 'Master Merchant Aldric'
    const before = row.previousElementSibling!.getBoundingClientRect()
    const at = label.getBoundingClientRect()
    return {
      lines: at.height > 24,
      aboveWords:
        at.bottom <= row.querySelector('.lq-line')!.getBoundingClientRect().top,
      belowRowBefore: at.top >= before.bottom,
    }
  })
  expect(clear.lines).toBe(true)
  expect(clear.aboveWords).toBe(true)
  expect(clear.belowRowBefore).toBe(true)
})
