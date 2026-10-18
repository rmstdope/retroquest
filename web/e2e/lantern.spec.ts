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

  test('the classic UI stays the default', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).not.toHaveAttribute('data-ui', 'lantern')
  })
})
