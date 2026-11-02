import { test, expect, type Page } from '@playwright/test'

/** Open the game on a laptop and close the opening chapter page: the first room arrives. */
async function startAct1(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
}

/** Push a further first-visit arrival into the turns, as a new room would. */
async function pushArrival(
  page: Page,
  description = 'Some place.',
  text = '',
): Promise<void> {
  await page.evaluate(
    ({ description, text }) => {
      const app = (
        document.querySelector('#app') as unknown as {
          __vue_app__: {
            config: {
              globalProperties: {
                $pinia: { state: { value: { game: { turns: unknown[] } } } }
              }
            }
          }
        }
      ).__vue_app__
      app.config.globalProperties.$pinia.state.value.game.turns.push({
        id: 999,
        command: null,
        text,
        room: 'Nowhere',
        description: { moved: true, firstVisit: true },
        gained: [],
        lost: [],
        narrate: true,
        arrival: {
          room: 'Nowhere',
          description,
          characters: [],
          items: [],
          exits: {},
        },
      })
    },
    { description, text },
  )
}

const arrival = (page: Page) => page.getByTestId('arrival-on-picture')
const story = (page: Page) => page.getByRole('region', { name: 'Story' })

test.describe('the arrival told on the picture', () => {
  test('tells the first room on the picture, the story aside, and a click clears it', async ({
    page,
  }) => {
    await startAct1(page)

    const line = arrival(page).locator('.lq-arrival-line')
    await expect(line).toBeVisible()
    await expect(line).not.toHaveText('')
    await expect(
      arrival(page).getByText('Click or press Enter to continue'),
    ).toBeVisible()
    // Narration is off here: the reading-time bar shows.
    await expect(page.getByTestId('arrival-bar')).toBeVisible()
    // The act's opening leaves no card yet, so there is no tab either.
    await expect(story(page)).toBeHidden()
    const tab = page.getByRole('button', { name: /Narration/ })
    await expect(tab).toHaveCount(0)

    await arrival(page).click({ position: { x: 600, y: 300 } })
    await expect(line).toHaveCount(0)
    await expect(tab).toHaveCount(0)
    await expect(story(page)).toBeHidden()
  })

  test('goes on with Enter', async ({ page }) => {
    await startAct1(page)
    await expect(arrival(page).locator('.lq-arrival-line')).toBeVisible()
    const commands = page.getByTestId('command')
    const before = await commands.count()
    await page.keyboard.press('Enter')
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
    // Enter went on; it did not press the focused verb.
    await expect(commands).toHaveCount(before)
  })

  test('goes on with Enter in the empty command box', async ({ page }) => {
    await startAct1(page)
    await page
      .getByRole('region', { name: 'Actions' })
      .getByRole('button', { name: 'Type', exact: true })
      .click()
    await pushArrival(page)
    const line = arrival(page).locator('.lq-arrival-line')
    await expect(line).toHaveText('Some place.')
    const commands = page.getByTestId('command')
    const before = await commands.count()
    await page.getByLabel('Command').focus()
    await page.keyboard.press('Enter')
    await expect(line).toHaveCount(0)
    await expect(commands).toHaveCount(before)
  })

  test('clears when an action is chosen', async ({ page }) => {
    await startAct1(page)
    await expect(arrival(page).locator('.lq-arrival-line')).toBeVisible()
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
    await expect(story(page)).toBeVisible()
  })

  test.describe('with the narrator on', () => {
    // Narration on, as for a new player (the config turns it off elsewhere).
    test.use({ storageState: { cookies: [], origins: [] } })

    test('tells the arrival of a turn played with the action buttons (rq-mfb1)', async ({
      page,
    }) => {
      // Narrated clips end a second after they start (no audio device in CI).
      await page.addInitScript(() => {
        HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
          if (this.src.includes('/audio/narration/'))
            setTimeout(() => this.dispatchEvent(new Event('ended')), 1000)
          return Promise.resolve()
        }
      })
      await startAct1(page)
      await arrival(page).click({ position: { x: 600, y: 300 } })
      await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
      const actions = page.getByRole('region', { name: 'Actions' })
      await actions.getByRole('button', { name: 'Talk', exact: true }).click()
      // The click that plays the turn must not also clear the arrival it starts.
      await actions.getByRole('button', { name: 'Voice', exact: true }).click()
      const lines = arrival(page).locator('.lq-arrival-line')
      await expect(lines.first()).toContainText('You answer it')
      // The narrator goes on into Elior's Cottage, described as any arrival is.
      await expect(lines.first()).toContainText('A modest cottage', {
        timeout: 20_000,
      })
      // And then the quests the waking starts.
      await expect(arrival(page)).toContainText('Shadows Over Willowbrook', {
        timeout: 20_000,
      })
    })
  })

  test('clears when the player types, and keeps what was typed', async ({
    page,
  }) => {
    await startAct1(page)
    await page
      .getByRole('region', { name: 'Actions' })
      .getByRole('button', { name: 'Type', exact: true })
      .click()
    await pushArrival(page)
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveText(
      'Some place.',
    )
    const input = page.getByLabel('Command')
    await input.focus()
    await page.keyboard.type('look')
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
    await expect(input).toHaveValue('look')
  })

  test('has no slide under Reduce motion, and the bar still runs', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await startAct1(page)
    await expect(arrival(page).locator('.lq-arrival-line')).toBeVisible()
    await expect(page.getByTestId('arrival-bar').locator('i')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(arrival(page).locator('.lq-arrival-line')).toHaveCount(0)
  })

  test('tells the arrival on a phone, with its own hint', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    await expect(arrival(page)).toContainText('Tap to continue')
  })

  test('keeps the continue pill in view under a long arrival on a phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    await arrival(page).click()
    await pushArrival(
      page,
      'A long, slow dream of fields and rivers. '.repeat(30),
    )
    const text = arrival(page).locator('.lq-arrival-text')
    await expect(text).toBeVisible()
    const scrolls = await text.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    )
    expect(scrolls).toBe(true)
    const box = await text.boundingBox()
    const pill = await arrival(page).locator('.lq-arrival-pill').boundingBox()
    const stage = await arrival(page).boundingBox()
    expect(pill).not.toBeNull()
    expect(stage).not.toBeNull()
    expect(pill!.y).toBeGreaterThan(0)
    expect(box!.y).toBeGreaterThanOrEqual(stage!.y + 100)
    expect(pill!.y + pill!.height).toBeLessThanOrEqual(
      stage!.y + stage!.height - 100,
    )
  })

  test('leaves a short screen as it was', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    await expect(arrival(page)).toHaveCount(0)
    await expect(story(page)).toBeVisible()
  })

  test.describe('a long arrival on a short laptop window', () => {
    const EVENTS =
      '[event]You answer it, and the room holds its breath while the old rafters creak above you.[/event]\n' +
      '[event]The whisper comes once more, closer than before, and it seems to know your name.[/event]\n' +
      '[event]The dark lets go of you, one thread at a time, as a hand lets go of a sleeper’s sleeve.[/event]\n' +
      '[event]A grey light finds the edges of the shutters and lays itself along the floor.[/event]\n' +
      '[event]Somewhere below, a kettle begins to tick against the iron of the hob.[/event]'
    const PLACE =
      'A low room of dark beams and old rugs, warm with the last of the fire. ' +
      'The shutters are closed against the morning. A kettle ticks on the hob.'

    /** Open a laptop window of the given height with a long arrival told. */
    async function longArrival(page: Page, height: number): Promise<void> {
      await page.setViewportSize({ width: 1280, height })
      await page.goto('/')
      await page.getByRole('button', { name: 'Start', exact: true }).click()
      await page.locator('.lq-chapter-button').click()
      await arrival(page).click()
      await pushArrival(page, PLACE, EVENTS)
      // The cleared arrival has faded away.
      await expect(arrival(page).locator('.lq-arrival-card')).toHaveCount(1)
    }

    /** Whether every shown line sits between the top buttons and the actions. */
    async function clearOfTheChrome(page: Page): Promise<void> {
      const buttons = await page
        .getByRole('button', { name: /^Bag/ })
        .boundingBox()
      // No tab is left on the laptop during an arrival: the actions are the floor.
      const tab = await page
        .getByRole('region', { name: 'Actions' })
        .boundingBox()
      const pill = await arrival(page).locator('.lq-arrival-pill').boundingBox()
      for (const line of await arrival(page)
        .locator('.lq-arrival-line')
        .all()) {
        const box = await line.boundingBox()
        expect(box!.y).toBeGreaterThanOrEqual(buttons!.y + buttons!.height)
        expect(box!.y + box!.height).toBeLessThanOrEqual(tab!.y)
      }
      expect(pill!.y + pill!.height).toBeLessThanOrEqual(tab!.y)
    }

    test('turns into pages that start below the buttons, in the same type', async ({
      page,
    }) => {
      await longArrival(page, 560)
      const lines = arrival(page).locator('.lq-arrival-line')
      await expect(lines.first()).toBeVisible()
      const size = await lines
        .first()
        .evaluate((el) => getComputedStyle(el).fontSize)
      expect(size).toBe('24px')
      await clearOfTheChrome(page)
      const first = await lines.allTextContents()
      expect(first.join(' ')).toContain('You answer it')
      expect(first.join(' ')).not.toContain('The dark lets go')
      // A click turns the page, the hint stays, and nothing is added.
      await arrival(page).click({ position: { x: 600, y: 300 } })
      await expect(lines.first()).not.toHaveText(first[0])
      await clearOfTheChrome(page)
      await expect(arrival(page).locator('.lq-arrival-hint')).toHaveText(
        'Click or press Enter to continue',
      )
      // Pages and parts go on with Enter until the arrival clears.
      for (let i = 0; i < 12 && (await lines.count()); i++)
        await page.keyboard.press('Enter')
      await expect(lines).toHaveCount(0)
      await expect(story(page)).toBeVisible()
    })

    test('keeps a speaker’s quote on the page of the line that introduces it, and Space and Escape work', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 713 })
      await page.goto('/')
      await page.getByRole('button', { name: 'Start', exact: true }).click()
      await page.locator('.lq-chapter-button').click()
      await arrival(page).click()
      await pushArrival(
        page,
        'You are in Elior’s Cottage.',
        '[event]You answer it, and the room holds its breath while the old rafters creak above you.[/event]\n' +
          '[event]A grey light finds the edges of the shutters and lays itself along the floor.[/event]\n' +
          '[event]Somewhere below, a kettle begins to tick against the iron of the hob and wakes it.[/event]\n' +
          'The whisper comes once more, closer than the thunder, and this time there are words in it.\n' +
          '[dialogue]…and let them rest…[/dialogue]\n' +
          '[event]The dark lets go of you.[/event]',
      )
      await expect(arrival(page).locator('.lq-arrival-card')).toHaveCount(1)
      const lines = arrival(page).locator('.lq-arrival-line')
      const seen: string[] = []
      for (let i = 0; i < 6; i++) {
        const text = (await lines.allTextContents()).join(' | ')
        seen.push(text)
        if (text.includes('let them rest')) expect(text).toContain('whisper')
        await page.keyboard.press('Space')
        await expect(arrival(page).locator('.lq-arrival-card')).toHaveCount(1)
        if (text.includes('Elior')) break
      }
      expect(seen.some((text) => text.includes('let them rest'))).toBe(true)
      await page.keyboard.press('Escape')
      await expect(lines).toHaveCount(0)
    })

    test('is one page per part in a window tall enough', async ({ page }) => {
      await longArrival(page, 1000)
      const lines = arrival(page).locator('.lq-arrival-line')
      await expect(lines).toHaveCount(5)
      await page.keyboard.press('Enter')
      await expect(lines).toHaveCount(1)
      await page.keyboard.press('Enter')
      await expect(lines).toHaveCount(0)
    })

    test('is cut again when the window is resized', async ({ page }) => {
      await longArrival(page, 560)
      const lines = arrival(page).locator('.lq-arrival-line')
      await expect(lines.first()).toBeVisible()
      const before = await lines.count()
      await page.setViewportSize({ width: 1280, height: 1000 })
      await expect(lines).toHaveCount(5)
      expect(before).toBeLessThan(5)
      await clearOfTheChrome(page)
    })
  })
})
