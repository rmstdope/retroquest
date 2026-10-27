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

for (const { name, width, height } of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 720 },
]) {
  test(`marks a narrated paragraph with a rule inside the story on ${name}`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height })
    await slowNarrationClips(page)
    await startAct1(page)

    const input = page.getByLabel('Command')
    await input.fill('talk to voice')
    await input.press('Enter')

    // The rule is drawn at the paragraph's left edge, so that edge has to lie
    // inside the story, which clips whatever sticks out of it.
    const speaking = page.locator('.lq-block-text.lq-speaking')
    await expect(speaking).toHaveCount(1)
    const block = await speaking.boundingBox()
    const story = await page
      .getByRole('region', { name: 'Story' })
      .boundingBox()
    expect(block?.x).toBeGreaterThanOrEqual(story?.x ?? Infinity)
  })
}

test('keeps the room card until the voice reaches them, and a press in the journal catches up', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  await startAct1(page)
  const roomName = page.locator('.lq-room-name')
  const before = await roomName.textContent()

  const input = page.getByLabel('Command')
  await input.fill('talk to voice')
  await input.press('Enter')
  await expect(lastTurnBlocks(page).first()).toBeVisible()
  await expect(page.locator('.lq-speaking')).toHaveCount(1)
  // Block 1 is being read: the panels are still the ones from before the turn.
  await expect(roomName).toHaveText(before ?? '')

  // A press in a held panel only brings everything up to date.
  const turns = await page.getByTestId('turn').count()
  await page.getByRole('tab', { name: /^Quests/ }).click()
  // That press did nothing but catch up: the tab did not open.
  await expect(page.getByRole('tab', { name: /^Quests/ })).toHaveAttribute(
    'aria-selected',
    'false',
  )
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
  await expect(page.getByTestId('turn')).toHaveCount(turns)
})

test('Space and Enter press a focused verb and the voice keeps reading', async ({
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
    .getByRole('button', { name: 'Talk', exact: true })
  await verb.focus()
  const shown = await lastTurnBlocks(page).count()

  await page.keyboard.press(' ')
  // The press opened the builder (its Cancel shows); nothing was hurried.
  await expect(
    page.getByRole('region', { name: 'Actions' }).getByText('Cancel'),
  ).toBeVisible()
  expect(await lastTurnBlocks(page).count()).toBeLessThanOrEqual(shown + 1)
  await expect(page.locator('.lq-speaking')).not.toHaveCount(0)

  // Enter on the focused Cancel presses it too, and the voice still reads.
  await page.locator('.lq-cancel').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.lq-cancel')).toHaveCount(0)
  await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
})

test('typing keeps the voice reading, and Esc in the command box skips it', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  await startAct1(page)
  const input = page.getByLabel('Command')
  await input.fill('talk to voice')
  await input.press('Enter')
  await expect(lastTurnBlocks(page).first()).toBeVisible()
  const shown = await lastTurnBlocks(page).count()

  await input.pressSequentially('look')
  expect(await lastTurnBlocks(page).count()).toBeLessThanOrEqual(shown + 1)
  await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
  await expect(page.locator('.lq-narration-hint')).toHaveText('Esc to skip')

  // The word list is open for "look"; the first Esc closes it, the next skips.
  await input.press('Escape')
  await input.press('Escape')
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
  await expect(input).toHaveValue('look')
  await expect(input).toBeFocused()
})

test('holds the story still while it reads, and frees it when the reading ends', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 520 })
  await slowNarrationClips(page)
  await startAct1(page)
  const input = page.getByLabel('Command')
  const story = page.getByRole('region', { name: 'Story' })
  const top = (): Promise<number> => story.evaluate((el) => el.scrollTop)

  // Past the first three narrated turns the hint is gone until a scroll attempt.
  for (let i = 0; i < 4; i++) {
    await input.fill(i === 0 ? 'talk to voice' : 'look')
    await input.press('Enter')
    await expect(page.locator('.lq-speaking')).toHaveCount(1)
    if (i < 3) await story.dblclick({ position: { x: 5, y: 5 } })
  }
  await expect(page.locator('.lq-narration-hint')).toHaveCount(0)

  // Reading: a wheel turn moves nothing and brings the hint up.
  const held = await top()
  await story.hover()
  await page.mouse.wheel(0, -300)
  await expect(page.locator('.lq-narration-hint')).toBeVisible()
  expect(await top()).toBe(held)

  // Skipped: the story scrolls freely.
  await story.dblclick({ position: { x: 5, y: 5 } })
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
  await page.mouse.wheel(0, -300)
  await expect.poll(top).toBeLessThan(held)
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

  // Begin stays inside a short window while the page is read.
  await page.setViewportSize({ width: 1512, height: 300 })
  await expect(page.locator('.lq-chapter-button')).toBeInViewport()
  await page.setViewportSize({ width: 1280, height: 720 })

  // A tap on the text hurries; Continue stops the voice and enters the game.
  await page.locator('.lq-chapter-body').click()
  await page.locator('.lq-chapter-button').click()
  await expect(page.locator('.lq-chapter-button')).toHaveCount(0)
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Actions' })).toBeVisible()
})
