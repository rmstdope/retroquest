import { test, expect, type Page } from '@playwright/test'

/* Inject mock game state to bypass Pyodide loading (same approach as game.spec.ts). */
async function injectMockState(page: Page) {
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const app = (document.querySelector('#app') as any).__vue_app__
    const store = app.config.globalProperties.$pinia.state.value.game
    store.loading = false
    store.acceptInput = true
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

test.describe('Lantern UI (?ui=lantern)', () => {
  test('shows the Lantern shell with header, story and command box', async ({
    page,
  }) => {
    await page.goto('/?ui=lantern')
    await injectMockState(page)

    await expect(page.locator('html')).toHaveAttribute('data-ui', 'lantern')
    await expect(page.getByText('RetroQuest', { exact: true })).toBeVisible()
    await expect(page.getByTestId('act')).toHaveText('Act I')
    await expect(page.getByTestId('quest-progress')).toContainText('4/11')
    await expect(page.getByText('bustles with life')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Look', exact: true }),
    ).toBeEnabled()
  })

  test('uses the Lantern colours', async ({ page }) => {
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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

  test('the classic UI stays the default', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).not.toHaveAttribute('data-ui', 'lantern')
  })

  test('wraps many chips on a phone instead of hiding them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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

  test('puts the room card, map and journal around the story on a laptop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/?ui=lantern')
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
    // Keep the real game from loading over the mock state.
    await page.route('https://cdn.jsdelivr.net/pyodide/**', (r) => r.abort())
    await page.setViewportSize({ width: 1024, height: 700 })
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
    await page.goto('/?ui=lantern')
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
      // Keep the real game (and its intro pop-up) from loading over the mock.
      await page.route('https://cdn.jsdelivr.net/pyodide/**', (r) => r.abort())
      await page.setViewportSize({ width, height })
      await page.goto('/?ui=lantern')
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
})
