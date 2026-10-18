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
    await expect(page.getByLabel('Command')).toBeEnabled()
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

    await expect(page.getByLabel('Command')).toBeInViewport()
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
    await expect(page.getByLabel('Command')).toBeInViewport()
  })
})
