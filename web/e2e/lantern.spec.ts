import { test, expect, enterCommand, type Page, skipTelling } from './fixtures'

/** Wait for the game to start (the act chunks load after the page's load event). */
async function waitForGame(page: Page) {
  await page.waitForFunction(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const app = (document.querySelector('#app') as any).__vue_app__
    return app && !app.config.globalProperties.$pinia.state.value.game.loading
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
}

/* Replace the started game's state with a known mock state. */
async function injectMockState(page: Page) {
  await waitForGame(page)
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const app = (document.querySelector('#app') as any).__vue_app__
    const store = app.config.globalProperties.$pinia.state.value.game
    store.loading = false
    store.acceptInput = true
    // The real game opens on its title page and act intro: close them.
    store.showTitle = false
    store.showModal = false
    store.modalChapter = null
    store.modalQuest = null
    store.modalQueue = []
    store.questProgress = {
      completed: 4,
      total: 11,
      actNumber: 1,
      mainQuest: 'Shadows over Willowbrook',
    }
    store.turns = [
      {
        id: 1,
        command: null,
        text: 'The heart of [room_name]Willowbrook[/room_name] bustles with life.',
        room: 'Village Square',
        roomChanged: true,
        gained: [],
        lost: [],
      },
    ]
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
}

test.describe('Lantern UI (the default)', () => {
  test('shows the Lantern shell with story and command box, and no top bar', async ({
    page,
  }) => {
    await page.goto('/')
    await injectMockState(page)

    await expect(page.getByRole('banner')).toHaveCount(0)
    await expect(page.getByText('RetroQuest', { exact: true })).toHaveCount(0)
    await expect(page.getByText('bustles with life')).toBeVisible()
    await expect(page.locator('.lq-name-btn')).toBeEnabled()
    await expect(page.locator('.lq-composer, .lq-dock')).toHaveCount(0)
  })

  test('has no action bar: the room name fans out Look, Search and Rest, and F1 brings up the typing box', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    await page
      .getByTestId('arrival-on-picture')
      .click({ position: { x: 200, y: 300 } })
    await expect(page.locator('.lq-composer, .lq-dock')).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Actions' })).toHaveCount(0)
    await expect(page.getByLabel('Command')).toHaveCount(0)

    const turns = (): Promise<number> =>
      page.evaluate(
        () =>
          (
            document.querySelector('#app') as unknown as {
              __vue_app__: {
                config: {
                  globalProperties: {
                    $pinia: { state: { value: { game: { turns: unknown[] } } } }
                  }
                }
              }
            }
          ).__vue_app__.config.globalProperties.$pinia.state.value.game.turns
            .length,
      )

    // The room's name fans out three pills; Look sends and folds them.
    const name = page.locator('.lq-name-btn')
    await expect(name).toContainText('▾')
    await name.click()
    await expect(name).toContainText('▴')
    await expect(page.locator('.lq-pill')).toHaveText([
      '👁 Look',
      '🔍 Search',
      '💤 Rest',
    ])
    const before = await turns()
    await page.locator('.lq-pill', { hasText: 'Look' }).click()
    await expect.poll(turns).toBe(before + 1)
    await expect(page.locator('.lq-pill')).toHaveCount(0)

    // F1 shows the box and takes the cursor; Enter sends and the box stays; F1 hides it.
    await page.keyboard.press('F1')
    const input = page.getByLabel('Command')
    await expect(input).toBeFocused()
    await input.fill('look')
    await input.press('Enter')
    await expect.poll(turns).toBe(before + 2)
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('')
    await page.keyboard.press('F1')
    await expect(input).toHaveCount(0)
  })

  test.describe('on a phone (touch)', () => {
    test.use({ hasTouch: true, isMobile: true })
    test('a phone has no typing box: F1 does nothing', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')
      await injectMockState(page)
      await page.keyboard.press('F1')
      await expect(page.getByLabel('Command')).toHaveCount(0)
      await expect(page.locator('.lq-composer, .lq-dock')).toHaveCount(0)
    })
  })

  test('a narrow mouse window gets the box too: only a phone has none', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 800 })
    await page.goto('/')
    await injectMockState(page)
    await page.keyboard.press('F1')
    await expect(page.getByLabel('Command')).toBeVisible()
  })

  test('uses the Lantern colours', async ({ page }) => {
    await page.goto('/')
    await injectMockState(page)

    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--lq-accent')
        .trim(),
    )
    expect(['#ffa914', '#f29e00']).toContain(accent)
  })

  test('is the only UI, also for old ?ui= links', async ({ page }) => {
    for (const url of ['/', '/?ui=classic', '/?ui=lantern']) {
      await page.goto(url)
      // The page has the Lantern ground (light, as the browser prefers light)
      await expect(page.locator('body')).toHaveCSS(
        'background-color',
        'rgb(245, 240, 230)',
      )
      // and no browser default margin around the shell
      await expect(page.locator('body')).toHaveCSS('margin', '0px')
    }
  })

  test('draws the divider above the music credits in Help', async ({
    page,
  }) => {
    await page.goto('/')
    // The same divider markup as useMusic's buildAttributionHtml
    await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<hr id="credits-divider" style="border-color:red;margin:12px 0">',
      )
    })

    const divider = page.locator('#credits-divider')
    await expect(divider).toHaveCSS('border-top-width', '1px')
    await expect(divider).toHaveCSS('border-top-color', 'rgb(255, 0, 0)')
  })

  test('wraps many chips on a phone instead of hiding them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      // Lost spells keep their chips on the stage (gained things and lost items fly).
      const lost = [
        'Faded Photograph',
        'Wandering Boots',
        'Travel Cloak',
        'Magnetic Fishing Rod',
        'Lantern',
      ].map((name) => ({ kind: 'spell', name, count: 1 }))
      store.turns = [{ ...store.turns[0], command: 'give all', lost }]
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const row = page.getByRole('group', { name: 'Changes' })
    await expect(row).toBeVisible()
    const fits = await row.evaluate((el) => el.scrollWidth <= el.clientWidth)
    expect(fits).toBe(true)
  })

  test('draws the not-yet checklist circle in the muted colour', async ({
    page,
  }) => {
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.turns = [
        {
          ...store.turns[0],
          text: '[pending] * Sturdy footwear[/pending]',
        },
      ]
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const colours = await page
      .locator('.lq-check-pending .lq-check-mark')
      .evaluate((el) => {
        const probe = document.createElement('span')
        probe.style.color = 'var(--lq-muted)'
        document.body.append(probe)
        const muted = getComputedStyle(probe).color
        probe.remove()
        return { border: getComputedStyle(el).borderTopColor, muted }
      })
    expect(colours.border).toBe(colours.muted)
  })

  test('keeps a long story inside the screen without scrolling the page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      const long = 'The wind howls across the fields. '.repeat(20)
      store.turns = Array.from({ length: 30 }, (_, i) => ({
        ...store.turns[0],
        id: i + 1,
        command: `wait ${i}`,
        text: long,
        // Chips and checklists carry visually hidden screen-reader text.
        gained: [{ kind: 'spell', name: 'revive', count: 1 }],
      }))
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
    await page.waitForTimeout(300)

    const layout = await page.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
      scrollY: window.scrollY,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      rootBg: getComputedStyle(
        document.querySelector('.lq-root') as HTMLElement,
      ).backgroundColor,
    }))
    expect(layout.pageHeight).toBeLessThanOrEqual(layout.viewport)
    expect(layout.scrollY).toBe(0)
    expect(layout.bodyBg).toBe(layout.rootBg)
    // No action bar below the words: the foot of the page is the story's.
    await expect(page.locator('.lq-composer, .lq-dock')).toHaveCount(0)
  })

  test('shows the word list while typing in the F1 box', async ({ page }) => {
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.completionTree = { take: { bucket: null, bread: null }, look: null }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
    await page.keyboard.press('F1')
    const input = page.getByLabel('Command')

    await input.fill('lo')
    await input.press('Tab')
    await expect(input).toHaveValue('look ')

    await input.fill('take b')
    await expect(page.getByRole('option')).toHaveText(['bucket', 'bread'])
    await expect(page.getByRole('option', { selected: true })).toHaveText(
      'bucket',
    )
    // Each option is what a click at its centre hits (not hidden or clipped).
    for (const option of await page.getByRole('option').all()) {
      const onTop = await option.evaluate((el) => {
        const box = el.getBoundingClientRect()
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        )
        return hit !== null && el.contains(hit)
      })
      expect(onTop, `${await option.textContent()} is on top`).toBe(true)
    }
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(input).toHaveValue('take bread ')
    await expect(page.getByRole('option')).toHaveCount(0)

    await input.fill('xyz')
    await expect(page.getByRole('listbox')).toHaveText('No match for “xyz”')
  })

  test('plays the room on its picture on a laptop: plate, buttons, map on pointing, drawer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.roomName = 'Village Square'
      store.exits = { north: "Mira's Hut" }
      store.rawInventory = [{ name: 'bread', description: 'A small loaf.' }]
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const plate = page.getByRole('region', { name: 'Current location' })
    await expect(plate).toContainText('Village Square')
    await expect(plate).not.toContainText('You are in')
    for (const name of [/Quests · 0/, /Story so far/])
      await expect(page.getByRole('button', { name })).toBeVisible()
    // The Bag and Spells are the belt of pictures at the foot of the picture.
    await expect(page.getByRole('button', { name: /^Bag · / })).toHaveCount(0)
    await expect(page.locator('[data-belt-pic="item:bread"]')).toBeVisible()
    await expect(page.getByRole('complementary')).toHaveCount(0)

    const exit = page.getByRole('button', { name: "Go north to Mira's Hut" })
    await expect(exit).toHaveCount(0)
    await page.getByRole('button', { name: /Map/ }).hover()
    await expect(exit).toHaveCount(0)
    await page.getByRole('button', { name: /Map/ }).click()
    await expect(exit).toBeVisible()

    // The bug's own direction: with Quests open, Map replaces it and is pressable.
    await page.getByRole('button', { name: /Quests · 0/ }).click()
    await page.getByRole('button', { name: /Map/ }).click()
    await expect(
      page.getByRole('complementary', { name: 'Journal drawer' }),
    ).toHaveCount(0)
    await expect(exit).toBeVisible()
    await expect(exit).toBeEnabled()

    await page.getByRole('button', { name: /Quests · 0/ }).click()
    const drawer = page.getByRole('complementary', { name: 'Journal drawer' })
    await expect(drawer.getByRole('heading', { name: 'Quests' })).toBeVisible()
    await expect(drawer.getByRole('tab')).toHaveCount(0)
    // The lit button stays in sight, and pressing it again closes the drawer.
    await expect(page.getByRole('button', { name: /Quests · 0/ })).toBeVisible()
    await page.getByRole('button', { name: /Quests · 0/ }).click()
    await expect(drawer).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Quests · 0/ })).toBeFocused()
    await page.getByRole('button', { name: /Quests · 0/ }).click()
    await expect(drawer).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.locator('.lq-stage-plate')).toHaveCount(0)
    await expect(page.locator('.lq-phone-plate')).toBeVisible()
  })

  test('opens the story so far as a drawer beside the stage on a laptop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await injectMockState(page)

    const button = page.getByRole('button', { name: /Story so far/ })
    await button.click()
    const drawer = page.getByRole('complementary', {
      name: 'Story so far drawer',
    })
    await expect(drawer).toBeVisible()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    const box = await drawer.boundingBox()
    expect(Math.abs(box!.width - 640)).toBeLessThanOrEqual(2)
    // It reaches the foot of the picture: no action bar is left to stop above.
    const stage = await page.locator('.lq-stage').boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      stage!.y + stage!.height + 1,
    )

    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    await expect(button).toBeFocused()

    // Quests swaps it, and pressing the picture closes it.
    await button.click()
    await page.getByRole('button', { name: /Quests · / }).click()
    await expect(drawer).toHaveCount(0)
    await expect(
      page.getByRole('complementary', { name: 'Journal drawer' }),
    ).toBeVisible()
    await button.click()
    await page
      .locator('.lq-stage-picture')
      .click({ position: { x: 20, y: 300 } })
    await expect(drawer).toHaveCount(0)
  })

  test('puts speech on the picture on a laptop: the grandmother on the right, Elior on the left, cleared by ✕ and walking', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    const lines = page.getByTestId('speech-line')

    // Talking to the Voice wakes Elior in his cottage: the talk is told as
    // any conversation is (rq-uqp8), the Voice's line on the right, and
    // leaves the screen with the dream.
    await enterCommand(page, 'talk to voice')
    await expect(lines).toHaveCount(1)
    await expect(page.locator('.lq-line-right')).toContainText('let them rest')
    await expect(
      page.getByRole('region', { name: 'Current location' }),
    ).toContainText("Elior's Cottage")
    await expect(lines).toHaveCount(0)

    // Talking to his grandmother: no portrait is made yet, so the initial
    // card stands in, on the right.
    await enterCommand(page, 'talk to grandmother')
    await expect(page.locator('.lq-line-right .lq-line-name')).toContainText(
      'Grandmother',
    )
    await expect(page.locator('.lq-line-right .lq-initial')).toHaveText('G')
    await expect(page.locator('.lq-line-left')).toHaveCount(0)
    // His lines ask for the one shared Elior portrait; it is not painted yet,
    // so the E card stands in.
    const eliorFace = page.waitForRequest(
      /images\/generated\/portrait-elior\.png/,
    )
    await enterCommand(page, 'say hello to grandmother')
    await eliorFace
    await expect(page.locator('.lq-line-left .lq-initial')).toHaveText('E')
    await expect(page.locator('.lq-line-left .lq-line-name')).toHaveText(
      'Elior',
    )
    // Her answer is read before the next command: one that cut it off would
    // leave it on the picture (rq-dvj2).
    await expect(lines.last()).toContainText('I do like to hear you talk')

    // The one Hide clears both sides and leaves the Show tab, with focus on it.
    await page.getByRole('button', { name: '▾ Hide' }).click()
    await expect(lines.first()).toBeHidden()
    await expect(page.getByRole('button', { name: '▴ Show' })).toBeFocused()
    await page.getByRole('button', { name: '▴ Show' }).click()
    await expect(lines.first()).toBeVisible()
    await expect(page.getByRole('button', { name: '▾ Hide' })).toBeFocused()

    // N hides too (not in the command box, where it is a letter).
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
    await page.keyboard.press('n')
    await expect(lines.first()).toBeHidden()
    await page.keyboard.press('n')
    await expect(lines.first()).toBeVisible()

    // Walking away clears the speech.
    await enterCommand(page, 'look')
    await expect(lines).toHaveCount(0)

    // A phone tells the same turns in the one column: nothing is lost.
    await enterCommand(page, 'talk to grandmother')
    await expect(lines.first()).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(lines.first()).toBeVisible()
    await expect(page.locator('.lq-speech-zone')).toHaveCount(0)
  })

  test('a phone shows chat-style lines with a small round portrait, named once (rq-c15r.2)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    const say = async (command: string): Promise<void> => {
      await enterCommand(page, command)
    }
    await say('talk to voice')
    await say('talk to grandmother')

    const portrait = page.locator('.lq-one-column [data-testid="portrait"]')
    await expect(portrait.first()).toBeVisible()
    const size = await portrait.first().boundingBox()
    expect(Math.round(size!.width)).toBe(32)
    expect(Math.round(size!.height)).toBe(32)
    // The Voice's line from the dream left the column with the dream.
    await expect(page.locator('.lq-one-column .lq-line-name')).toHaveText([
      'Grandmother',
    ])
  })

  test('tells each turn in bubbles that grow up to the room plate, hides to a tab', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await injectMockState(page)
    const tell = (id: number, text: string, command: string | null) =>
      page.evaluate(
        ([turnId, turnText, turnCommand]) => {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const app = (document.querySelector('#app') as any).__vue_app__
          const store = app.config.globalProperties.$pinia.state.value.game
          /* eslint-enable @typescript-eslint/no-explicit-any */
          store.turns.push({
            id: turnId,
            command: turnCommand,
            text: turnText,
            room: 'Village Square',
            gained: [],
            lost: [],
          })
        },
        [id, text, command] as const,
      )
    const paper = page.locator('.lq-story-wrap')
    const hide = page.getByRole('button', { name: '▾ Hide' })
    const tab = page.getByRole('button', { name: '▴ Show' })
    const cards = paper.locator('.lq-story')
    const height = async () => (await cards.boundingBox())!.height

    await tell(2, 'You take the bread.', 'take bread')
    await expect(paper.getByText('You take the bread.')).toBeVisible()
    await expect(paper.getByText('› take bread')).toHaveCount(0)
    // The bubbles before it stay above, dimmed.
    await expect(paper.getByText('The heart of')).toBeVisible()
    const small = await height()
    expect(small).toBeLessThan(400)

    const long = Array.from(
      { length: 30 },
      (_, i) => `Line ${i} of a very long answer that goes on and on.`,
    ).join('\n')
    await tell(3, long, 'look')
    const plate = (await page.locator('.lq-stage-plate').boundingBox())!
    await expect.poll(height).toBeGreaterThan(small)
    // The column stops below the room plate and scrolls inside.
    await expect
      .poll(async () => (await cards.boundingBox())!.y)
      .toBeGreaterThanOrEqual(plate.y + plate.height)
    await expect(page.getByRole('button', { name: /More below/ })).toBeVisible()

    await hide.click()
    await expect(tab).toBeFocused()
    await expect(paper).toBeHidden()
    await page.keyboard.press('n')
    await expect(paper).toBeVisible()
    await expect(hide).toBeVisible()
    await page.keyboard.press('n')
    await expect(tab).toBeVisible()

    await tell(4, 'The wind turns.', 'wait')
    await expect(tab).toHaveCount(0)
    await expect(paper.getByText('The wind turns.')).toBeVisible()

    // A turn with nothing to tell adds no bubble, and the paper stays open.
    const bubbles = await paper.locator('.lq-bubble').count()
    await tell(5, '', 'wait')
    await expect(tab).toHaveCount(0)
    await expect(paper.locator('.lq-bubble')).toHaveCount(bubbles)
    await expect(paper.getByText('› wait')).toHaveCount(0)
  })

  test('keeps the story and the room name in view in a busy room on a laptop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 700 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.roomName = "Dragon's Hall of the Long Banners and Many Torches"
      store.items = Array.from({ length: 12 }, (_, i) => `trinket ${i}`)
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    // The room's name button stays whole in view, however long the name.
    await expect(page.locator('.lq-name-btn')).toBeInViewport({ ratio: 1 })
    const story = await page
      .getByRole('region', { name: 'Story' })
      .boundingBox()
    expect(story!.height).toBeGreaterThan(60)
  })

  test('switches sections with the tabs on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.rawInventory = [{ name: 'bread', description: 'A small loaf.' }]
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
    const sections = page.getByRole('navigation', { name: 'Sections' })

    await sections.getByRole('button', { name: 'Bag' }).click()

    await expect(page.getByRole('heading', { name: 'Bag' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Use Bread' })).toBeVisible()
    const navBox = await sections.boundingBox()
    expect(navBox!.y + navBox!.height).toBeCloseTo(844, 0)

    await sections.getByRole('button', { name: 'Story' }).click()
    await expect(page.locator('.lq-phone-plate')).toBeVisible()
  })

  test('puts the section tabs on top of the page in phone landscape, under the menu button', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/')
    await injectMockState(page)

    await expect(page.getByRole('banner')).toHaveCount(0)
    await expect(
      page.getByRole('navigation', { name: 'Sections' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Menu', exact: true }),
    ).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('lines the Map heading up with the Bag heading on a phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/')
    await injectMockState(page)
    const sections = page.getByRole('navigation', { name: 'Sections' })
    const textStart = (name: string) =>
      page.getByRole('heading', { name }).evaluate((h) => {
        const range = document.createRange()
        range.selectNodeContents(h)
        const box = range.getBoundingClientRect()
        return { x: Math.round(box.x), y: Math.round(box.y) }
      })

    await sections.getByRole('button', { name: 'Bag' }).click()
    const bag = await textStart('Bag')
    await sections.getByRole('button', { name: 'Map' }).click()

    expect(await textStart('Map')).toEqual(bag)
  })

  for (const [width, height] of [
    [390, 844],
    [320, 568],
    [844, 390],
  ] as const) {
    test(`opens a long turn at its start with More below at ${width}×${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      await injectMockState(page)
      await page.evaluate(() => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const app = (document.querySelector('#app') as any).__vue_app__
        const store = app.config.globalProperties.$pinia.state.value.game
        store.turns = [
          ...store.turns,
          {
            ...store.turns[0],
            id: 2,
            command: 'talk to spirit',
            text:
              'The spirit speaks. ' +
              'Moonlight pools between the roots as it tells its tale. '.repeat(
                40,
              ),
            roomChanged: false,
          },
        ]
        /* eslint-enable @typescript-eslint/no-explicit-any */
      })

      const story = page.getByRole('region', { name: 'Story' })
      const newest = story.locator('[data-testid="turn"]').last()
      await expect(newest).toContainText('The spirit speaks.')
      // Both tops in one frame: the paper glides as it grows (0.2 s), so two
      // separate reads can straddle the glide and see the story move between them.
      const offset = await page.evaluate(() => {
        const box = (selector: string): DOMRect => {
          const all = document.querySelectorAll(selector)
          return all[all.length - 1].getBoundingClientRect()
        }
        return (
          box('section[aria-label="Story"] [data-testid="turn"]').top -
          box('section[aria-label="Story"]').top
        )
      })
      expect(Math.abs(offset)).toBeLessThan(24)

      const pill = page.getByRole('button', { name: 'More below', exact: true })
      await expect(pill).toBeVisible()
      // A 44px touch target around the slimmer pill.
      const pillBox = (await pill.boundingBox())!
      const hit = await page.evaluate(
        ([x, y]) =>
          !!document.elementFromPoint(x, y)?.closest('.lq-more-below'),
        [pillBox.x + pillBox.width / 2, pillBox.y - 3],
      )
      expect(hit).toBe(true)
      for (let i = 0; i < 40 && (await pill.isVisible()); i++) {
        await pill.click()
        await page.waitForTimeout(400)
      }
      await expect(pill).toBeHidden()
      await expect(newest.getByText(/tells its tale\.\s*$/)).toBeInViewport()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test('shows a completed quest in the story, not as a pop-up, on a small phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.turns.push({
        id: 999,
        command: 'kneel',
        text: 'You kneel until dawn.',
        room: store.roomName,
        roomChanged: false,
        gained: [],
        lost: [],
        arrival: null,
        quests: [
          {
            kind: 'completed',
            name: 'Oath of Stillness',
            main: false,
            text: 'You kept your vow through the long night.',
            progress: { completed: 5, total: 8 },
          },
        ],
      })
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    // Told in the middle of the picture, never as a pop-up; it leaves no line in the story.
    const middle = page.getByTestId('arrival-on-picture')
    await expect(middle.getByText('Oath of Stillness')).toBeVisible()
    await expect(middle.getByText('Side quest complete · 5 of 8')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await skipTelling(page)
    await expect(middle.getByText('Oath of Stillness')).toHaveCount(0)
    const story = page.getByRole('region', { name: 'Story' })
    await expect(story).not.toContainText('Oath of Stillness')
  })

  test('keeps the failed-load screen reachable with a long error on a short screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 568, height: 320 })
    await page.goto('/')
    await waitForGame(page)
    // A start-up failure as the store shows it (the engine itself starts at once).
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.loading = true
      store.loadFailed = true
      store.loadingStatus =
        'Error: ' + '  at Act1.getActIntro (act1/Act1.ts:1)\n'.repeat(40)
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
    await page.getByText('Details', { exact: true }).click()

    const title = page.getByRole('heading', { name: 'RetroQuest' })
    await title.scrollIntoViewIfNeeded()
    const box = await title.boundingBox()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    )
    expect(width).toBe(568)
  })

  test('names the game in type, in place of the old block-letter art', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForGame(page)
    await expect(page.locator('.lq-title-page')).toBeVisible()
    await expect(page.locator('.lq-art')).toHaveCount(0)
    await expect(page.getByText('Welcome to')).toBeVisible()

    for (const size of [
      { width: 390, height: 780 },
      { width: 780, height: 390 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(size)
      await expect(page.locator('.lq-wordmark')).toBeVisible()
      await expect(page.locator('.lq-credit')).toBeVisible()
    }
  })

  test('opens the title screen in steps, and a key press finishes it without pressing Start', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    await waitForGame(page)
    const start = page.getByRole('button', { name: 'Start', exact: true })
    await expect(page.locator('.lq-title-page')).toHaveClass(/is-playing/)
    await expect(page.locator('.lq-title-buttons')).toHaveAttribute('inert')

    await page.evaluate(() => (document.activeElement as HTMLElement).blur())
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
      'BODY',
    )
    await page.keyboard.press('Enter')
    await expect(page.locator('.lq-title-page')).toHaveClass(/is-open/)
    await expect(start).toBeFocused()
    await expect(page.locator('.lq-title-page')).toBeVisible()
  })

  test('a press where Start will appear only finishes the opening', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    await waitForGame(page)
    const box = (await page.locator('.lq-title-buttons').boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + 20)
    await expect(page.locator('.lq-title-page')).toHaveClass(/is-open/)
    await expect(page.locator('.lq-title-page')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Start', exact: true }),
    ).toBeFocused()
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await expect(page.locator('.lq-title-page')).toHaveCount(0)
  })

  test('keeps the title screen on its dark scheme in the light theme', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await waitForGame(page)
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-theme', 'light'),
    )
    const colour = (selector: string): Promise<string> =>
      page
        .locator(selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(await colour('.lq-title-page')).toBe('rgb(16, 21, 26)')
    const text = await page
      .locator('.lq-wordmark')
      .evaluate((el) => getComputedStyle(el).color)
    expect(text).toBe('rgb(255, 184, 54)')
  })

  test('asks to save before finishing in a bottom sheet on a small phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.modalChapter = {
        kind: 'complete',
        act: 'Act IV',
        title: 'The Long Night Ends',
        body: 'Congratulations — you have completed Act IV!',
        stats: { questsCompleted: 6, questsTotal: 6, spells: 14, places: 18 },
        final: true,
      }
      store.showModal = true
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    await page.getByRole('button', { name: 'Finish the game' }).click()

    const dialog = page.getByRole('dialog', { name: 'Save before you finish?' })
    await expect(dialog).toBeVisible()
    const box = await dialog.boundingBox()
    expect(Math.round(box!.y + box!.height)).toBe(568)
    expect(box!.width).toBe(320)
    await expect(
      dialog.getByRole('button', { name: 'Save and finish' }),
    ).toBeInViewport()
    await expect(
      dialog.getByRole('button', { name: 'Finish without saving' }),
    ).toBeInViewport()
    await expect(
      dialog.getByRole('button', { name: 'Save and finish' }),
    ).toBeFocused()

    await dialog.getByRole('button', { name: 'Finish without saving' }).click()

    await expect(
      page.getByRole('heading', { name: 'Thank you for playing RetroQuest' }),
    ).toBeFocused()
    await expect(page.getByText('This game was not saved.')).toBeVisible()
  })

  test('scrolls a long ending on a small phone and offers nothing to press', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.ending = {
        text: 'The long night is over and the realm breathes again. '.repeat(
          40,
        ),
        saved: true,
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const title = page.getByRole('heading', {
      name: 'Thank you for playing RetroQuest',
    })
    await expect(title).toBeInViewport()
    const foot = page.getByText('Your game is saved in the quick slot.')
    await expect(foot).not.toBeInViewport()
    await foot.scrollIntoViewIfNeeded()
    await expect(foot).toBeInViewport()
    // The page itself never scrolls; the end screen does.
    expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(
      0,
    )
    await expect(
      page.locator('button, a, input, textarea, select, [role="dialog"]'),
    ).toHaveCount(0)
  })

  test('starts afresh after a reload on the end screen', async ({ page }) => {
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.ending = { text: 'The end of it all.', saved: false }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
    await expect(page.getByText('This game was not saved.')).toBeVisible()

    await page.reload()
    await waitForGame(page)

    await expect(page.locator('.lq-title-page')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Thank you for playing RetroQuest' }),
    ).toHaveCount(0)
  })

  for (const width of [1280, 360]) {
    test(`hugs a centred closing line with the speaking rule at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      await injectMockState(page)
      await page.evaluate(() => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const app = (document.querySelector('#app') as any).__vue_app__
        const store = app.config.globalProperties.$pinia.state.value.game
        store.modalChapter = {
          kind: 'complete',
          act: 'Act II',
          title: 'Act II complete',
          body: 'Malakar is real.',
          stats: { questsCompleted: 6, questsTotal: 6, spells: 9, places: 12 },
          nextAct: 'Act III',
        }
        store.showModal = true
        /* eslint-enable @typescript-eslint/no-explicit-any */
      })

      const block = page.locator('.lq-chapter-block').first()
      const body = page.locator('.lq-chapter-body')
      await expect(block).toBeVisible()
      const before = (await block.boundingBox())!
      const column = (await body.boundingBox())!
      // The block wraps its short line instead of spanning the column, centred in it.
      expect(before.width).toBeLessThan(column.width / 2)
      const centre = before.x + before.width / 2
      expect(Math.abs(centre - (column.x + column.width / 2))).toBeLessThan(2)

      // The rule appearing moves nothing.
      await block.evaluate((el) => el.classList.add('lq-speaking'))
      expect(await block.boundingBox()).toEqual(before)
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true)
    })
  }

  test('keeps a wrapped closing line inside the column on a phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.modalChapter = {
        kind: 'complete',
        act: 'Act III',
        title: 'Act III complete',
        body:
          'Your parents were Malakar’s closest friends. ' +
          'The Dragon says they are warded away, not dead.',
        stats: { questsCompleted: 6, questsTotal: 6, spells: 9, places: 12 },
        nextAct: 'Act IV',
      }
      store.showModal = true
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const block = page.locator('.lq-chapter-block').first()
    await expect(block).toBeVisible()
    const box = (await block.boundingBox())!
    const column = (await page.locator('.lq-chapter-body').boundingBox())!
    expect(box.width).toBeGreaterThan(column.width * 0.85)
    expect(box.x).toBeGreaterThanOrEqual(column.x - 1)
    expect(box.x + box.width).toBeLessThanOrEqual(column.x + column.width + 1)
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
  })
  test('puts the speaking rule at the widest line of a wrapped closing line', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.modalChapter = {
        kind: 'complete',
        act: 'Act III',
        title: 'Act III complete',
        body: 'Short.',
        stats: { questsCompleted: 6, questsTotal: 6, spells: 9, places: 12 },
        nextAct: 'Act IV',
      }
      store.showModal = true
    })
    await expect(page.locator('.lq-chapter-block').first()).toBeVisible()
    // The text arrives after the page is up, as it does when a voice starts.
    await page.evaluate(() => {
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.modalChapter = {
        ...store.modalChapter,
        body:
          'Your parents were Malakar’s closest friends. ' +
          'The Dragon says they are warded away, not dead.',
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const block = page.locator('.lq-chapter-block').first()
    await expect(block).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const box = (await block.boundingBox())!
    // The left edge and width of the text itself, line by line.
    const text = await block.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let left = Infinity
      let right = -Infinity
      const lines = new Set<number>()
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const range = document.createRange()
        range.selectNodeContents(n)
        for (const r of Array.from(range.getClientRects())) {
          if (r.width === 0) continue
          left = Math.min(left, r.left)
          right = Math.max(right, r.right)
          lines.add(Math.round(r.top))
        }
      }
      return { left, right, lines: lines.size }
    })
    expect(text.lines).toBeGreaterThan(1)
    // The box starts 10px before the widest line and ends 10px after it.
    expect(Math.abs(text.left - box.x - 10)).toBeLessThan(2)
    expect(Math.abs(box.x + box.width - text.right - 10)).toBeLessThan(2)
  })

  // Where the news is not told in the middle (a short screen), the story keeps its cards.
  for (const [width, height] of [
    [900, 500],
    [667, 375],
  ]) {
    test(`shows an opened quest update inside its frame at ${width}×${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      await injectMockState(page)
      await page.evaluate(() => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const app = (document.querySelector('#app') as any).__vue_app__
        const store = app.config.globalProperties.$pinia.state.value.game
        store.turns.push({
          id: 998,
          command: 'talk to elder',
          text: 'The elder nods slowly.',
          room: store.roomName,
          roomChanged: false,
          gained: [],
          lost: [],
          arrival: null,
          quests: [
            {
              kind: 'updated',
              name: 'Shadows over Willowbrook',
              main: true,
              text: 'The villagers whisper of shadows beyond the mill.',
            },
          ],
        })
        /* eslint-enable @typescript-eslint/no-explicit-any */
      })

      const banner = page.getByRole('button', { name: /Quest updated/ })
      await banner.click()
      const body = page.getByText(
        'The villagers whisper of shadows beyond the mill.',
      )
      await expect(body).toBeVisible()
      // The frame is the bordered box of the notice itself: the button or
      // the notice that holds it, never a box further out.
      const frame = await banner.evaluate((button) => {
        const framed = [button, button.parentElement].find(
          (el) => el && parseFloat(getComputedStyle(el).borderTopWidth) > 0,
        )
        if (!framed) return null
        const r = framed.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
      })
      expect(frame).not.toBeNull()
      const text = (await body.boundingBox())!
      expect(text.y).toBeGreaterThanOrEqual(frame!.top)
      expect(text.y + text.height).toBeLessThanOrEqual(frame!.bottom)
      expect(text.x).toBeGreaterThanOrEqual(frame!.left)
      expect(text.x + text.width).toBeLessThanOrEqual(frame!.right)
    })
  }
})
