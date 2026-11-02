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
