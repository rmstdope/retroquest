import { test, expect, type Page } from '@playwright/test'

const APP_URL = '/'

/* ------------------------------------------------------------------ */
/*  Helper: inject mock game state to bypass Pyodide loading          */
/* ------------------------------------------------------------------ */

async function injectMockGameState(page: Page) {
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const app = (document.querySelector('#app') as any).__vue_app__
    const pinia = app.config.globalProperties.$pinia
    const store = pinia.state.value.game

    store.loading = false
    store.loadingStatus = ''
    store.roomName = 'Village Square'
    store.roomDescription =
      '<p>The village square is bustling with activity.</p>'
    store.characters = ['Merchant', 'Guard']
    store.items = ['Old Key']
    store.exits = { north: 'Forest Path', south: 'Town Gate' }
    store.inventory = [
      { name: 'Wooden Sword', description: 'A simple weapon.' },
    ]
    store.spells = [{ name: 'Heal', description: 'Restores health.' }]
    store.activeQuests = [
      { name: 'The Missing Amulet', description: 'Find it.' },
    ]
    store.completedQuests = []
    store.lastOutput = '<p>Welcome to <strong>RetroQuest</strong>!</p>'
    store.acceptingInput = true
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
  // Let Vue re-render
  await page.waitForTimeout(500)
}

/* ------------------------------------------------------------------ */
/*  Loading screen tests (fast — no Pyodide needed)                   */
/* ------------------------------------------------------------------ */

test.describe('Loading screen', () => {
  test('shows RetroQuest title and spinner', async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.getByText('RetroQuest', { exact: true })).toBeVisible()
    await expect(page.locator('.loading-spinner')).toBeVisible()
  })

  test('shows loading status text', async ({ page }) => {
    await page.goto(APP_URL)
    // The loading status should appear (e.g., "Loading Python runtime...")
    await expect(page.locator('.text-text-secondary')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('does not show game UI while loading', async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('input[type="text"]')).toBeHidden()
  })
})

/* ------------------------------------------------------------------ */
/*  Game UI tests (mock game state injected, no Pyodide needed)       */
/* ------------------------------------------------------------------ */

test.describe('Game UI with mock state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL)
    // Wait for Vue to mount (loading screen appears)
    await expect(page.locator('.loading-spinner')).toBeVisible({
      timeout: 10_000,
    })
    // Inject mock state to skip past loading
    await injectMockGameState(page)
  })

  test('game layout is visible after loading completes', async ({ page }) => {
    await expect(page.locator('text=⚔️ RetroQuest').first()).toBeVisible()
    await expect(page.locator('input[type="text"]')).toBeVisible()
  })

  test('sidebar shows quest, inventory, and spells sections', async ({
    page,
  }) => {
    await expect(page.getByText('Active Quests').first()).toBeVisible()
    await expect(page.getByText('Inventory').first()).toBeVisible()
    await expect(page.getByText('Spells').first()).toBeVisible()
  })

  test('sidebar displays injected data', async ({ page }) => {
    await expect(page.getByText('The Missing Amulet').first()).toBeVisible()
    await expect(page.getByText('Wooden Sword').first()).toBeVisible()
    await expect(page.getByText('Heal').first()).toBeVisible()
  })

  test('section headers toggle collapse', async ({ page }) => {
    const header = page.getByText('Active Quests').first()
    await header.click()
    // After collapse, quest item should be hidden
    await expect(page.getByText('The Missing Amulet')).toBeHidden()
    // Click again to expand
    await header.click()
    await expect(page.getByText('The Missing Amulet').first()).toBeVisible()
  })

  test('save and load buttons are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: '💾 Save' })).toBeVisible()
    await expect(page.getByRole('button', { name: '📂 Load' })).toBeVisible()
  })

  test('mute toggle button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /mute music/i }),
    ).toBeVisible()
  })

  test('room name is displayed', async ({ page }) => {
    await expect(page.getByText('Village Square').first()).toBeVisible()
  })

  test('exit chips are rendered', async ({ page }) => {
    await expect(page.locator('button.border-exits').first()).toBeVisible()
    await expect(page.getByText('Forest Path').first()).toBeVisible()
  })

  test('character chips are rendered', async ({ page }) => {
    await expect(page.locator('button.border-character').first()).toBeVisible()
  })

  test('game output shows history', async ({ page }) => {
    await expect(page.getByText('Welcome to RetroQuest!').first()).toBeVisible()
  })

  test('command input has correct placeholder', async ({ page }) => {
    const input = page.locator('input[type="text"]')
    const placeholder = await input.getAttribute('placeholder')
    expect(placeholder).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ */
/*  Mobile layout tests                                               */
/* ------------------------------------------------------------------ */

test.describe('Mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('.loading-spinner')).toBeVisible({
      timeout: 10_000,
    })
    await injectMockGameState(page)
  })

  test('sidebar is hidden on mobile', async ({ page }) => {
    const sidebar = page.locator('.max-md\\:hidden')
    await expect(sidebar).toBeHidden()
  })

  test('hamburger opens and close button closes drawer', async ({ page }) => {
    const hamburger = page.getByRole('button', {
      name: 'Open sidebar',
    })
    await expect(hamburger).toBeVisible()

    await hamburger.click()
    await expect(page.getByText('Menu').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible()

    await page.getByRole('button', { name: 'Close menu' }).click()
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeHidden()
  })
})
