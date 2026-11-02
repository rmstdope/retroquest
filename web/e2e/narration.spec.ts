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
  await openTyping(page)
}

/**
 * Switch the actions to typing: the stage's row has a Type button; on a phone
 * the folded bar's keyboard button opens the sheet straight into typing.
 */
async function openTyping(page: Page): Promise<void> {
  const type = page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Type', exact: true })
  if (await type.isVisible()) await type.click()
  else await page.getByRole('button', { name: 'Type a command' }).click()
}

/** Open the sheet into typing again after an answer folded it (the bar's keyboard button). */
async function reopenTyping(page: Page): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  if (!(await input.isVisible()))
    await page.getByRole('button', { name: 'Type a command' }).click()
}

/** Type a command and press Enter, opening the sheet again if the last answer folded it. */
async function enter(page: Page, command: string): Promise<void> {
  const input = page.getByLabel('Command', { exact: true })
  await reopenTyping(page)
  await input.fill(command)
  await input.press('Enter')
}

/** The narration paragraphs of the newest turn. */
const lastTurnBlocks = (page: Page) =>
  page.getByTestId('turn').last().locator('.lq-block-text')

test('tells an answer block by block, and a double tap shows the rest', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  // The story page of a short window reads the answer as it is told (a laptop
  // tells the walk into the first room in the middle of the picture).
  await page.setViewportSize({ width: 1280, height: 500 })
  await startAct1(page)

  const input = page.getByLabel('Command', { exact: true })
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

    await enter(page, 'talk to voice')

    // The rule is drawn at the paragraph's left edge, so that edge has to lie
    // inside the story, which clips whatever sticks out of it.
    const speaking = page.locator('.lq-block-text.lq-speaking')
    await expect(speaking).toHaveCount(1)
    const block = await speaking.boundingBox()
    // The quest news may already be told in the middle, which sets the story aside.
    const story = await page.locator('.lq-story').boundingBox()
    expect(block?.x).toBeGreaterThanOrEqual(story?.x ?? Infinity)
  })
}

test('opens a journal drawer at once while the voice reads, and a press inside it catches up', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  await startAct1(page)
  const roomName = page.locator('.lq-room-name')
  const before = await roomName.textContent()

  const input = page.getByLabel('Command', { exact: true })
  await input.fill('talk to voice')
  await input.press('Enter')
  // The card is away while the walk is told in the middle: it is there, not in view.
  await expect(lastTurnBlocks(page).first()).toBeAttached()
  await expect(page.locator('.lq-speaking')).toHaveCount(1)
  // Block 1 is being read: the panels are still the ones from before the turn.
  await expect(roomName).toHaveText(before ?? '')

  // A stage button is not a held panel: it opens its drawer, the voice reads on.
  const turns = await page.getByTestId('turn').count()
  await page.getByRole('button', { name: /^Quests/ }).click()
  const drawer = page.getByRole('complementary', { name: 'Journal drawer' })
  await expect(drawer).toHaveCount(1)
  await expect(page.locator('.lq-speaking')).toHaveCount(1)

  // The drawer is a held panel: a press in it only brings everything up to date.
  // Within one clip, so the voice ending by itself cannot pass it.
  await drawer.getByRole('tab', { name: /^Bag/ }).click()
  await expect(page.locator('.lq-speaking')).toHaveCount(0, { timeout: 1_000 })
  // That press did nothing but catch up: the Quests tab is still the open one.
  await expect(drawer.getByRole('tab', { name: /^Quests/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByTestId('turn')).toHaveCount(turns)
})

test('Space and Enter press a focused verb and the voice keeps reading', async ({
  page,
}): Promise<void> => {
  // A short screen: the text page, where the sheet is the composer (a taller
  // screen tells this first arrival on the picture, arrival.spec.ts).
  await page.setViewportSize({ width: 390, height: 500 })
  await slowNarrationClips(page)
  await startAct1(page)
  await enter(page, 'talk to voice')
  await expect(page.locator('.lq-speaking')).not.toHaveCount(0)

  // Back to the verbs, as the default mode has it, with one of them focused.
  await page.getByRole('button', { name: 'Actions ▴' }).click()
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
  // The press opened the builder (its ✕, read as Cancel, shows); nothing was
  // hurried.
  await expect(
    page.getByRole('region', { name: 'Actions' }).getByRole('button', {
      name: 'Cancel',
    }),
  ).toBeVisible()
  expect(await lastTurnBlocks(page).count()).toBeLessThanOrEqual(shown + 1)
  await expect(page.locator('.lq-speaking')).not.toHaveCount(0)

  // Enter on the focused Cancel presses it too, and the voice still reads.
  const cancel = page
    .getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Cancel' })
  await cancel.focus()
  await page.keyboard.press('Enter')
  await expect(cancel).toHaveCount(0)
  await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
})

test('typing keeps the voice reading, and Esc in the command box skips it', async ({
  page,
}): Promise<void> => {
  // A short screen: the text page, where the sheet is the composer (a taller
  // screen tells this first arrival on the picture, arrival.spec.ts).
  await page.setViewportSize({ width: 390, height: 500 })
  await slowNarrationClips(page)
  await startAct1(page)
  await enter(page, 'talk to voice')
  await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
  const shown = await lastTurnBlocks(page).count()

  await reopenTyping(page)
  const input = page.getByLabel('Command', { exact: true })
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
  // A short screen: the text page, whose story is held still while it reads.
  await page.setViewportSize({ width: 390, height: 500 })
  await slowNarrationClips(page)
  await startAct1(page)
  const story = page.getByRole('region', { name: 'Story' })
  const top = (): Promise<number> => story.evaluate((el) => el.scrollTop)

  // Past the first three narrated turns the hint is gone until a scroll attempt.
  for (let i = 0; i < 4; i++) {
    await enter(page, i === 0 ? 'talk to voice' : 'look')
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

  // The story page of a short window reads the answer as it is told (a laptop
  // tells the walk into the first room in the middle of the picture).
  await page.setViewportSize({ width: 1280, height: 500 })
  await startAct1(page)
  const input = page.getByLabel('Command', { exact: true })
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
  // The story page of a short window reads the answer as it is told (a laptop
  // tells the walk into the first room in the middle of the picture).
  await page.setViewportSize({ width: 1280, height: 500 })
  await startAct1(page)

  const input = page.getByLabel('Command', { exact: true })
  await input.fill('talk to voice')
  await input.press('Enter')
  await expect(page.locator('.lq-narration-hint')).toBeVisible()

  await page.getByRole('region', { name: 'Story' }).dblclick({
    position: { x: 5, y: 5 },
  })
  await expect(page.locator('.lq-narration-hint')).toHaveCount(0)

  await page.setViewportSize({ width: 1280, height: 720 })
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

test('in the one column the held story follows Elior’s journal lines as they are read (rq-s738)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 720 })
  await slowNarrationClips(page)
  await startAct1(page)
  const story = page.getByRole('region', { name: 'Story' })

  // Into the cottage with the lantern lit; each reading skipped.
  for (const command of ['talk to voice', 'use lantern']) {
    await enter(page, command)
    await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
    await expect
      .poll(async () => {
        await page.keyboard.press('Escape')
        return page.locator('.lq-speaking').count()
      })
      .toBe(0)
  }

  await enter(page, 'use journal')
  // Elior's line being read is ringed, and the held story has brought all of
  // it into view (from its top, when it is taller than the story).
  const line = page
    .getByTestId('column-turn')
    .last()
    .getByTestId('speech-line')
    .filter({ has: page.locator('.lq-speaking') })
    .first()
  await expect(line).toHaveCount(1)
  await expect
    .poll(async () => {
      const lineBox = await line.boundingBox()
      const storyBox = await story.boundingBox()
      if (!lineBox || !storyBox) return false
      const storyBottom = storyBox.y + storyBox.height
      const tall = lineBox.height > storyBox.height
      return (
        lineBox.y >= storyBox.y - 1 &&
        (tall || lineBox.y + lineBox.height <= storyBottom + 1)
      )
    })
    .toBe(true)
})

/** The ways a skip reaches the narration in rq-cynd's test, and what each presses. */
const SKIPS = {
  Space: null,
  'tap on the story': '.lq-story [data-testid="turn"]:last-child',
  'tap on the picture': '.lq-stage-picture',
  'tap on the speech': '[data-testid="speech-zone"]',
} as const

for (const { name, width, height } of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 720 },
]) {
  for (const [how, target] of Object.entries(SKIPS)) {
    // The phone tells speech in the one column: it has no speech zone.
    if (name === 'phone' && how === 'tap on the speech') continue
    test(`on ${name} a ${how} during Elior's journal skips one block at a time (rq-cynd)`, async ({
      page,
    }): Promise<void> => {
      await page.setViewportSize({ width, height })
      await slowNarrationClips(page)
      await startAct1(page)

      // Into the cottage with the lantern lit; each reading skipped.
      for (const command of ['talk to voice', 'use lantern']) {
        await enter(page, command)
        await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
        await expect
          .poll(async () => {
            await page.keyboard.press('Escape')
            return page.locator('.lq-speaking').count()
          })
          .toBe(0)
      }

      await enter(page, 'use journal')
      const speaking = page.locator('.lq-speaking').first()
      const skip = async (): Promise<void> => {
        if (target === null) {
          // Space hurries while focus is not in the command box.
          await page.evaluate(() =>
            (document.activeElement as HTMLElement | null)?.blur(),
          )
          await page.keyboard.press(' ')
          return
        }
        // Never so soon after the last tap that the two make a double tap.
        await page.waitForTimeout(400)
        await page.locator(target).first().dispatchEvent('click')
      }
      await expect(speaking).toContainText('The ink is slightly')
      await skip()
      await expect(speaking).toContainText('The storm kept me up')
      await skip()
      await expect(speaking).toContainText('When I slept, I dreamed')
    })
  }
}
