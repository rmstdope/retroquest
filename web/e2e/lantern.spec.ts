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
})
