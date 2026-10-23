import { test, expect, type Page } from '@playwright/test'

// Narration on, as for a new player (the config turns it off for the other specs).
test.use({ storageState: { cookies: [], origins: [] } })

/**
 * Narrated clips end three seconds after they start (the browser has no
 * audio device in CI); other sounds are left alone.
 */
async function slowNarrationClips(page: Page): Promise<void> {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (this.src.includes('/audio/narration/'))
        setTimeout(() => this.dispatchEvent(new Event('ended')), 3000)
      return Promise.resolve()
    }
  })
}

/** Open the game, close the opening chapter page and switch the actions to typing. */
async function startAct1(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  await page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
    .click()
}

/** The narration paragraphs of the newest turn. */
const lastTurnBlocks = (page: Page) =>
  page.getByTestId('turn').last().locator('.lq-block-text')

test('tells an answer block by block, and a double tap shows the rest', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  await startAct1(page)

  const input = page.getByLabel('Command')
  await input.fill('talk to voice')
  await input.press('Enter')

  await expect(lastTurnBlocks(page).first()).toBeVisible()
  const early = await lastTurnBlocks(page).count()
  expect(early).toBe(1)
  await expect(page.locator('.lq-speaking')).toHaveCount(1)

  // One tap hurries to the next block; two taps in a row show the rest.
  const story = page.getByRole('region', { name: 'Story' })
  await story.dblclick({ position: { x: 5, y: 5 } })
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
  expect(await lastTurnBlocks(page).count()).toBeGreaterThan(early)
})

test('shows an answer at once with narration off', async ({
  page,
}): Promise<void> => {
  await page.addInitScript(() =>
    localStorage.setItem('retroquest_settings', '{"narrationOn":false}'),
  )
  await startAct1(page)
  const input = page.getByLabel('Command')
  await input.fill('talk to voice')
  await input.press('Enter')

  await expect(lastTurnBlocks(page).first()).toBeVisible()
  expect(await lastTurnBlocks(page).count()).toBeGreaterThan(1)
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
})
