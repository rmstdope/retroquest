import { test, expect, type Page } from './fixtures'

/**
 * A narrator's card on the laptop stays whole in the left column once the
 * reading has left it for a line spoken in the speech column, and a play
 * session raises no ResizeObserver loop errors (rq-bbsj).
 */

// Narration on, as for a new player (the config turns it off for the other specs).
test.use({
  storageState: { cookies: [], origins: [] },
  narrationRecordings: true,
})

/**
 * Narrated clips end shortly after they start and their time never moves (the
 * browser has no audio device in CI), so a card is followed at its first word
 * and no further, as a hurried one is; every error event the window sees is
 * kept in `window.__errors`.
 */
async function prepare(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const errors: string[] = []
    Object.assign(window, { __errors: errors })
    window.addEventListener('error', (event) => errors.push(event.message))
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (this.src.includes('/audio/narration/'))
        setTimeout(() => this.dispatchEvent(new Event('ended')), 1200)
      return Promise.resolve()
    }
  })
}

/** Type a command. */
async function enter(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  await input.click()
  await input.fill(command)
  await input.press('Enter')
}

/** The error messages the window has seen. */
async function errors(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __errors: string[] }).__errors,
  )
}

test('the dream card is whole while Grandmother answers, and nothing loops', async ({
  page,
}): Promise<void> => {
  test.setTimeout(90_000)
  await prepare(page)
  await page.setViewportSize({ width: 1400, height: 757 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
    .click()
  await enter(page, 'talk to voice')
  await page.keyboard.press('Escape')
  for (const command of [
    'use lantern',
    'take bread',
    'take lantern',
    'talk to grandmother',
    'use journal',
  ]) {
    await enter(page, command)
    await page.keyboard.press('Escape')
  }

  await enter(page, 'talk to grandmother')
  // Grandmother's question is read in the speech column, after the card.
  await expect(page.locator('.lq-thread .lq-speaking')).toContainText(
    'That voice',
    { timeout: 30_000 },
  )
  const fit = await page.evaluate(() => {
    const story = document.querySelector('.lq-cards .lq-story')!
    const card = Array.from(document.querySelectorAll('.lq-cards .lq-bubble'))
      .filter((el) => el.textContent!.startsWith('You tell her about'))
      .at(-1)!
    return {
      cardBottom: card.getBoundingClientRect().bottom,
      paneBottom: story.getBoundingClientRect().bottom,
    }
  })
  expect.soft(fit.cardBottom).toBeLessThanOrEqual(fit.paneBottom)

  expect(
    (await errors(page)).filter((message) =>
      message.includes('ResizeObserver'),
    ),
  ).toEqual([])
})
