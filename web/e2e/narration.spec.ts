import { test, expect, type Locator, type Page } from './fixtures'

// Narration at full volume, as for a new player (the config sets it to 0 for the other specs).
test.use({
  storageState: { cookies: [], origins: [] },
  narrationRecordings: true,
})

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

/** The app's game store, as much of it as the tests read. */
interface AppRoot extends Element {
  __vue_app__?: {
    config: {
      globalProperties: {
        $pinia: { state: { value: { game: { turns: unknown[] } } } }
      }
    }
  }
}

/** How many turns the game has told (its record, not the cards on screen). */
async function turnCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const root: AppRoot | null = document.querySelector('#app')
    const game =
      root?.__vue_app__?.config.globalProperties.$pinia.state.value.game
    return game?.turns.length ?? -1
  })
}

/** The narration paragraphs of the newest turn. */
const lastTurnBlocks = (page: Page) =>
  page.getByTestId('turn').last().locator('.lq-block-text')

/** Press and hold the mouse at `position` in `locator` long enough to skip (0.7 s), then let go. */
async function holdToSkip(
  page: Page,
  locator: Locator,
  position = { x: 5, y: 5 },
): Promise<void> {
  const box = await locator.boundingBox()
  if (!box) throw new Error('nothing to hold')
  await page.mouse.move(box.x + position.x, box.y + position.y)
  await page.mouse.down()
  await page.waitForTimeout(900)
  await page.mouse.up()
}

test('tells an answer block by block, a tap hurries and a hold shows the rest', async ({
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

  // A tap hurries to the next block, and a quick second tap only hurries again.
  const story = page.getByRole('region', { name: 'Story' })
  await story.dblclick({ position: { x: 5, y: 5 } })
  await expect(page.locator('.lq-speaking')).toHaveCount(1)
  expect(await lastTurnBlocks(page).count()).toBeGreaterThan(early)

  // Held, the ring shows; held long enough, the rest is shown at once.
  const box = (await story.boundingBox())!
  await page.mouse.move(box.x + 5, box.y + 5)
  await page.mouse.down()
  await expect(page.getByTestId('hold-ring')).toBeVisible()
  await page.waitForTimeout(800)
  await page.mouse.up()
  await expect(page.getByTestId('hold-ring')).toHaveCount(0)
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
})

test('a hold let go before the ring is full skips nothing', async ({
  page,
}): Promise<void> => {
  await slowNarrationClips(page)
  await page.setViewportSize({ width: 1280, height: 500 })
  await startAct1(page)
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('talk to voice')
  await input.press('Enter')
  await expect(page.locator('.lq-speaking')).toHaveCount(1)
  const blocks = await lastTurnBlocks(page).count()

  const story = page.getByRole('region', { name: 'Story' })
  const box = (await story.boundingBox())!
  await page.mouse.move(box.x + 5, box.y + 5)
  await page.mouse.down()
  await expect(page.getByTestId('hold-ring')).toBeVisible()
  await page.mouse.up()
  await expect(page.getByTestId('hold-ring')).toHaveCount(0)
  // Not skipped, and not even a step: the same block is still being read.
  await expect(page.locator('.lq-speaking')).toHaveCount(1)
  expect(await lastTurnBlocks(page).count()).toBe(blocks)
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
  // The answer is read over the dream first.
  await expect(lastTurnBlocks(page).first()).toBeAttached()
  await expect(page.locator('.lq-speaking')).toHaveCount(1)
  // Before the waking the room's picture goes through the dark and the room's
  // name changes there; the rest of the panels still wait.
  await expect(roomName).not.toHaveText(before ?? '')

  // A stage button is not a held panel: it opens its drawer, the voice reads on.
  const commands = await turnCount(page)
  await page.getByRole('button', { name: /^Quests/ }).click()
  const drawer = page.getByRole('complementary', { name: 'Journal drawer' })
  await expect(drawer).toHaveCount(1)
  // The voice reads on: on the sides, or the waking in the middle of the dark.
  const reading = page.locator(
    '.lq-speaking, [data-testid="scene-interlude"]:not(.lq-interlude-leave-active)',
  )
  await expect(reading).toHaveCount(1)

  // The drawer is a held panel: a press in it only brings everything up to date.
  // Within one clip, so the voice ending by itself cannot pass it.
  await drawer.getByRole('button', { name: 'Close' }).click()
  await expect(reading).toHaveCount(0, { timeout: 1_000 })
  // That press did nothing but catch up: the drawer is still open.
  await expect(drawer).toHaveCount(1)
  expect(await turnCount(page)).toBe(commands)
})

test('Enter and Space on a focused verb hurry as the voice reads, without pressing it (rq-kfur)', async ({
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
  const actions = page.getByRole('region', { name: 'Actions' })
  await actions.getByRole('button', { name: 'Actions', exact: true }).click()
  const verb = actions.getByRole('button', { name: 'Talk', exact: true })
  const cancel = actions.getByRole('button', { name: 'Cancel' })

  // Enter on the focused verb is the hurry too: no builder, no turn.
  const sent = await turnCount(page)
  await verb.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  expect(await cancel.count()).toBe(0)
  expect(await turnCount(page)).toBe(sent)

  // A button that sends nothing keeps its Enter: Cancel still cancels.
  await verb.click()
  await expect(cancel).toBeVisible()
  await cancel.focus()
  await page.keyboard.press('Enter')
  await expect(cancel).toHaveCount(0)

  // Space on the focused verb is the hurry the hint invites: the verb is not
  // pressed, and no turn is sent.
  const commands = await turnCount(page)
  await verb.focus()
  await page.keyboard.press(' ')
  // Let a press, had there been one, open the builder before looking.
  await page.waitForTimeout(300)
  expect(await cancel.count()).toBe(0)
  expect(await turnCount(page)).toBe(commands)
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
    if (i < 3) await holdToSkip(page, story)
  }
  await expect(page.locator('.lq-narration-hint')).toHaveCount(0)

  // Reading: a wheel turn moves nothing and brings the hint up.
  const held = await top()
  await story.hover()
  await page.mouse.wheel(0, -300)
  await expect(page.locator('.lq-narration-hint')).toBeVisible()
  expect(await top()).toBe(held)

  // Skipped: the story scrolls freely.
  await holdToSkip(page, story)
  await expect(page.locator('.lq-speaking')).toHaveCount(0)
  await page.mouse.wheel(0, -300)
  await expect.poll(top).toBeLessThan(held)
})

test('hints at hurrying on the first narrated turn, and Settings has a volume for it but no switch', async ({
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

  await holdToSkip(page, page.getByRole('region', { name: 'Story' }))
  await expect(page.locator('.lq-narration-hint')).toHaveCount(0)

  await page.setViewportSize({ width: 1280, height: 720 })
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('switch', { name: 'Narration' })).toHaveCount(0)
  await expect(page.getByLabel('Narration volume')).toBeVisible()
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

for (const viewport of [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`Begin keeps its place while the opening page's paragraphs appear, on ${viewport.name} (rq-m98d)`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize(viewport)
    await slowNarrationClips(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()

    // While the title is read no paragraph is shown yet.
    const button = page.locator('.lq-chapter-button')
    await expect(page.locator('.lq-chapter-title.lq-speaking')).toHaveCount(1)
    await expect(page.locator('.lq-chapter-block')).toHaveCount(0)
    const before = await button.boundingBox()

    // Each paragraph appears as its voice starts; Begin does not move.
    const blocks = page.locator('.lq-chapter-block')
    // Every paragraph's room is there from the start; the reading is over once all are shown.
    const unshown = page.locator('.lq-chapter-unshown')
    let seen = 0
    await expect
      .poll(
        async () => {
          const count = await blocks.count()
          if (count > seen) {
            seen = count
            expect(await button.boundingBox()).toEqual(before)
          }
          return count > 0 && (await unshown.count()) === 0
        },
        { intervals: [100], timeout: 25_000 },
      )
      .toBe(true)
    expect(seen).toBeGreaterThan(1)
  })
}

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
    // The lantern's line may have no recording yet; only the voice must speak.
    if (command === 'talk to voice') {
      await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
    }
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
        // The lantern's line may have no recording yet; only the voice must speak.
        if (command === 'talk to voice') {
          await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
        }
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

for (const { name, width, height } of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 720 },
]) {
  test(`on ${name} Elior's journal lines light the word being read (rq-v66a)`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height })
    await slowNarrationClips(page)
    // A narrated clip's time runs from when it is played, as a real one would.
    await page.addInitScript(() => {
      const started = new WeakMap<HTMLMediaElement, number>()
      const play = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        started.set(this, performance.now())
        return play.call(this)
      }
      Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
        get(this: HTMLMediaElement): number {
          const from = started.get(this)
          return from === undefined ? 0 : (performance.now() - from) / 1000
        },
        set(): void {},
      })
    })
    await startAct1(page)

    // Into the cottage with the lantern lit; each reading skipped.
    for (const command of ['talk to voice', 'use lantern']) {
      await enter(page, command)
      // The lantern's line may have no recording yet; only the voice must speak.
      if (command === 'talk to voice') {
        await expect(page.locator('.lq-speaking')).not.toHaveCount(0)
      }
      await expect
        .poll(async () => {
          await page.keyboard.press('Escape')
          return page.locator('.lq-speaking').count()
        })
        .toBe(0)
    }

    await enter(page, 'use journal')
    const lit = page
      .getByTestId('speech-line')
      .filter({ hasText: 'The storm kept me up' })
      .locator('.lq-w-now')
    await expect(lit).not.toHaveCount(0)
    await expect(lit.first()).not.toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    )
  })
}
