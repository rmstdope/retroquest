import { test, expect, type Page } from '@playwright/test'

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
      mainQuest: 'Shadows Over Willowbrook',
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
  test('shows the Lantern shell with header, story and command box', async ({
    page,
  }) => {
    await page.goto('/')
    await injectMockState(page)

    await expect(page.getByText('RetroQuest', { exact: true })).toBeVisible()
    await expect(page.getByTestId('act')).toHaveText('Act I')
    await expect(page.getByTestId('quest-progress')).toContainText('4/11')
    await expect(page.getByText('bustles with life')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Look', exact: true }),
    ).toBeEnabled()
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

  test('on a phone the text size popover stays on screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await injectMockState(page)

    await page.getByRole('button', { name: 'Text size' }).click()
    const box = await page
      .getByRole('group', { name: 'Text size' })
      .boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  })

  test('the command box stays on screen with a long story', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.turns = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        command: 'look',
        text: 'A long answer about the village square. '.repeat(8),
        room: 'Village Square',
        roomChanged: false,
        gained: [],
        lost: [],
      }))
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    await expect(page.getByRole('region', { name: 'Actions' })).toBeInViewport()
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
      const gained = [
        'Faded Photograph',
        'Wandering Boots',
        'Travel Cloak',
        'Magnetic Fishing Rod',
        'Lantern',
      ].map((name) => ({ kind: 'item', name, count: 1 }))
      store.turns = [{ ...store.turns[0], command: 'search', gained }]
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
    await expect(page.getByRole('region', { name: 'Actions' })).toBeInViewport()
  })

  test('builds a command with the action composer', async ({ page }) => {
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.items = ['old key']
      store.characters = ['mira']
      store.exits = { north: "Mira's Hut" }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const actions = page.getByRole('region', { name: 'Actions' })
    await expect(
      actions.getByRole('button', { name: "Go north to Mira's Hut" }),
    ).toBeVisible()

    await actions.getByRole('button', { name: 'Take', exact: true }).click()
    await actions.getByRole('button', { name: 'Old Key', exact: true }).click()
    await expect(page.getByTestId('preview')).toHaveText('take old key')
    await expect(
      actions.getByRole('button', { name: 'Do it', exact: true }),
    ).toBeEnabled()

    await actions.getByRole('button', { name: 'Type', exact: true }).click()
    await expect(page.getByLabel('Command')).toBeVisible()
  })

  test('highlights the selected input mode', async ({ page }) => {
    await page.goto('/')
    await injectMockState(page)
    const actions = page.getByRole('region', { name: 'Actions' })
    const background = (name: string) =>
      actions
        .getByRole('button', { name, exact: true })
        .evaluate((el) => getComputedStyle(el).backgroundColor)

    const selected = await background('Actions')
    const other = await background('Type')

    expect(selected).not.toBe(other)
    expect(other).toBe('rgba(0, 0, 0, 0)')
  })

  test('completes typed commands with Tab in Type mode', async ({ page }) => {
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.completionTree = { take: { bucket: null, bread: null }, look: null }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
    const actions = page.getByRole('region', { name: 'Actions' })
    await actions.getByRole('button', { name: 'Type', exact: true }).click()
    const input = page.getByLabel('Command')

    await input.fill('lo')
    await input.press('Tab')
    await expect(input).toHaveValue('look ')

    await input.fill('take b')
    await input.press('Tab')
    await expect(page.getByRole('option')).toHaveText(['bucket', 'bread'])
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(input).toHaveValue('take bucket ')
    await expect(page.getByRole('option')).toHaveCount(0)
  })

  // A desktop window narrower than 1024px gets the folding sheet, whose own
  // scrolling once clipped the list (rq-mvd); a laptop gets the side column.
  for (const { layout, width } of [
    { layout: 'narrow window', width: 900 },
    { layout: 'laptop', width: 1280 },
  ]) {
    test(`shows the Tab completion list above the command box (${layout})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      await injectMockState(page)
      await page.evaluate(() => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const app = (document.querySelector('#app') as any).__vue_app__
        const store = app.config.globalProperties.$pinia.state.value.game
        store.completionTree = {
          take: { bucket: null, bread: null, broom: null, bell: null },
          look: null,
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */
      })
      await page
        .getByRole('region', { name: 'Actions' })
        .getByRole('button', { name: 'Type', exact: true })
        .click()
      const input = page.getByLabel('Command')

      await input.fill('take b')
      await input.press('Tab')
      const list = page.getByRole('listbox', { name: 'Matching words' })
      await expect(list.getByRole('option')).toHaveText([
        'bucket',
        'bread',
        'broom',
        'bell',
      ])
      // Each option is what a click at its centre hits: not clipped by, or
      // hidden under, another part of the page.
      for (const option of await list.getByRole('option').all()) {
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
      await input.press('ArrowDown')
      await expect(list.getByRole('option', { selected: true })).toHaveText(
        'bread',
      )
      await input.press('Enter')
      await expect(input).toHaveValue('take bread ')
      await expect(list).toHaveCount(0)
    })
  }

  test('puts the room card, map and journal around the story on a laptop', async ({
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
      store.roomDescription = 'The heart of Willowbrook.'
      store.exits = { north: "Mira's Hut" }
      store.rawInventory = [{ name: 'bread', description: 'A small loaf.' }]
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    await expect(
      page.getByRole('region', { name: 'Current location' }),
    ).toBeVisible()
    const aside = page.getByRole('complementary', { name: 'Map and journal' })
    await expect(
      aside.getByRole('button', { name: "Go north to Mira's Hut" }),
    ).toBeVisible()
    await expect(aside.getByRole('tab', { name: /Bag · 1/ })).toBeVisible()
    // The tab labels fit the side column on one line each.
    const tabHeights = await aside
      .getByRole('tab')
      .evaluateAll((tabs) => tabs.map((t) => t.getBoundingClientRect().height))
    expect(Math.max(...tabHeights)).toBeLessThan(50)

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(aside).toBeHidden()
    await expect(
      page.getByRole('region', { name: 'Current location' }),
    ).toBeHidden()
  })

  test('keeps the story and actions in view when a long room is expanded', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 700 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.roomName = "Dragon's Hall"
      store.roomDescription =
        'The hall stretches on, banners stirring. '.repeat(60)
      store.items = Array.from({ length: 12 }, (_, i) => `trinket ${i}`)
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    await page.getByRole('button', { name: 'Read more' }).click()

    await expect(page.getByRole('region', { name: 'Actions' })).toBeInViewport({
      ratio: 1,
    })
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
    await expect(page.getByRole('region', { name: 'Actions' })).toBeHidden()
    const navBox = await sections.boundingBox()
    expect(navBox!.y + navBox!.height).toBeCloseTo(844, 0)

    await sections.getByRole('button', { name: 'Story' }).click()
    await expect(page.getByRole('region', { name: 'Actions' })).toBeVisible()
  })

  test('puts the section tabs in the header in phone landscape', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/')
    await injectMockState(page)

    await expect(
      page.getByRole('banner').getByRole('navigation', { name: 'Sections' }),
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

  test('caps the open action sheet at 62% of a phone screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    await injectMockState(page)

    const sheet = page.getByRole('region', { name: 'Actions' })
    await expect(sheet).toBeVisible()
    await page.getByRole('button', { name: 'More…' }).click()
    const box = await sheet.boundingBox()
    expect(box!.height).toBeLessThanOrEqual(568 * 0.62 + 1)

    await page.getByRole('button', { name: 'Hide actions' }).click()
    await expect(sheet).toBeHidden()
    await expect(page.getByRole('button', { name: 'Actions ▴' })).toBeFocused()
  })

  test('starts with the actions folded in phone landscape', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/')
    await injectMockState(page)

    await expect(page.getByRole('region', { name: 'Action bar' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Actions' })).toBeHidden()

    await page.getByRole('button', { name: 'Actions ▴' }).click()
    await expect(page.getByRole('region', { name: 'Actions' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('keeps Actions ▴ on one line and scrolls the exits on a narrow phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      app.config.globalProperties.$pinia.state.value.game.exits = {
        north: "Mira's Hut",
        east: 'General Store',
        south: 'Village Well',
        west: "Elior's Cottage",
        up: 'Bell Tower',
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
    await page.getByRole('button', { name: 'Hide actions' }).click()

    const open = page.getByRole('button', { name: 'Actions ▴' })
    const lines = await open.evaluate((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top)))
        .size
    })
    expect(lines).toBe(1)
    const exits = page.locator('.lq-dock-exits')
    expect(await exits.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    )
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
      const newest = story.locator('> *').last()
      await expect(newest).toContainText('The spirit speaks.')
      const [storyBox, turnBox] = [
        await story.boundingBox(),
        await newest.boundingBox(),
      ]
      expect(Math.abs(turnBox!.y - storyBox!.y)).toBeLessThan(24)

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

  test('uses a one-row header with the room name on a phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.roomName = "Entrance to Malakar's Fortress"
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const header = page.getByRole('banner')
    await expect(header).toContainText('Act I · Quests 4/11')
    await expect(
      header.getByRole('heading', { name: 'RetroQuest' }),
    ).toBeAttached()
    const height = await header.evaluate(
      (e) => e.getBoundingClientRect().height,
    )
    expect(height).toBeLessThan(72)
  })

  test('shows quest complete as a bottom sheet on a small phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.modalTitle = '🏆 Quest Complete!'
      store.modalQuest = {
        kind: 'completed',
        name: 'Oath of Stillness',
        main: false,
        text: 'You kept your vow through the long night. '.repeat(30),
        progress: { completed: 5, total: 8 },
      }
      store.showModal = true
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const dialog = page.getByRole('dialog', { name: 'Oath of Stillness' })
    await expect(dialog).toBeVisible()
    const box = await dialog.boundingBox()
    expect(Math.round(box!.y + box!.height)).toBe(568)
    expect(box!.width).toBe(320)
    await expect(
      dialog.getByRole('button', { name: 'Continue' }),
    ).toBeInViewport()
    await expect(dialog.getByText('5 of 8 quests')).toBeAttached()
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

  test('lines the title art up at its left edge', async ({ page }) => {
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.titleText = '[bold yellow]\n########\n##   ##.\n##\n[/bold yellow]'
      store.showTitle = true
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    const art = page.locator('.lq-art')
    await expect(art).toBeVisible()
    const lineStarts = await art.evaluate((pre) => {
      const text = pre.firstChild as Text
      const range = document.createRange()
      const starts: number[] = []
      let offset = 0
      for (const line of text.data.split('\n')) {
        range.setStart(text, offset)
        range.setEnd(text, offset + 1)
        starts.push(Math.round(range.getBoundingClientRect().left))
        offset += line.length + 1
      }
      return starts
    })
    expect(new Set(lineStarts).size).toBe(1)
  })

  test('shows a wordmark instead of the tiny title art on narrow phones', async ({
    page,
  }) => {
    await page.goto('/')
    await injectMockState(page)
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const store = app.config.globalProperties.$pinia.state.value.game
      store.titleText = '[bold yellow]\n########\n##   ##\n[/bold yellow]'
      store.showTitle = true
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    await page.setViewportSize({ width: 320, height: 568 })
    await expect(page.locator('.lq-wordmark')).toBeVisible()
    await expect(page.locator('.lq-art')).toBeHidden()

    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.locator('.lq-art')).toBeVisible()
    await expect(page.locator('.lq-wordmark')).toBeHidden()
  })

  test('leaves the full-screen button out of the narrowest header', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await injectMockState(page)
    const button = page.getByRole('button', { name: 'Full screen' })
    await expect(button).toBeVisible()

    await page.setViewportSize({ width: 320, height: 568 })
    await expect(button).toBeHidden()
  })
})
