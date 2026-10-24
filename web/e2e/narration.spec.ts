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

test('Space and Enter hurry with a verb focused, and do not press it', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  await startAct1(page)
  const input = page.getByLabel('Command')
  await input.fill('talk to voice')
  await input.press('Enter')
  await expect(lastTurnBlocks(page).first()).toBeVisible()

  // Back to the verbs, as the default mode has it, with one of them focused.
  await page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Actions', exact: true })
    .click()
  const verb = page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Look', exact: true })
  await verb.focus()
  const turns = await page.getByTestId('turn').count()
  const shown = await lastTurnBlocks(page).count()

  await page.keyboard.press(' ')
  await expect(lastTurnBlocks(page)).toHaveCount(shown + 1)
  await page.keyboard.press('Enter')
  await expect(lastTurnBlocks(page)).toHaveCount(shown + 2)
  // Neither key ran the verb: no new turn.
  expect(await page.getByTestId('turn').count()).toBe(turns)
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

test('hints at hurrying on the first narrated turn, and Settings can switch narration off', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  await startAct1(page)

  const input = page.getByLabel('Command')
  await input.fill('talk to voice')
  await input.press('Enter')
  await expect(page.locator('.lq-narration-hint')).toBeVisible()

  await page.getByRole('region', { name: 'Story' }).dblclick({
    position: { x: 5, y: 5 },
  })
  await expect(page.locator('.lq-narration-hint')).toHaveCount(0)

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const narration = page.getByRole('switch', { name: 'Narration' })
  await expect(narration).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByLabel('Narration volume')).toBeVisible()
  await narration.click()
  await expect(page.getByLabel('Narration volume')).toHaveCount(0)
})

test('reads the opening chapter page, and Continue mid-sentence moves on', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()

  // The title is read first; the paragraphs follow one by one.
  await expect(page.locator('.lq-chapter-title.lq-speaking')).toHaveCount(1)
  await expect(page.locator('.lq-chapter-block')).toHaveCount(0)
  await expect(page.locator('.lq-chapter-block').first()).toBeVisible()

  // A tap on the text hurries; Continue stops the voice and enters the game.
  await page.locator('.lq-chapter-body').click()
  await page.locator('.lq-chapter-button').click()
  await expect(page.locator('.lq-chapter-button')).toHaveCount(0)
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Actions' })).toBeVisible()
})
