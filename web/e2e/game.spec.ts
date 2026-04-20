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
/*  QuestModal Escape key tests                                        */
/* ------------------------------------------------------------------ */

test.describe('QuestModal – Escape key dismissal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('.loading-spinner')).toBeVisible({
      timeout: 10_000,
    })
    await injectMockGameState(page)
  })

  async function openModal(page: Page) {
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const app = (document.querySelector('#app') as any).__vue_app__
      const pinia = app.config.globalProperties.$pinia
      const store = pinia.state.value.game
      store.showModal = true
      store.modalTitle = 'Test Quest'
      store.modalBody = '<p>A new adventure awaits.</p>'
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
    await expect(page.getByText('Test Quest', { exact: true })).toBeVisible()
  }

  test('modal is visible after being opened', async ({ page }) => {
    await openModal(page)
    // visibility is already asserted inside openModal
    await expect(page.getByText('Test Quest', { exact: true })).toBeVisible()
  })

  test('pressing Escape closes the modal', async ({ page }) => {
    await openModal(page)
    await page.keyboard.press('Escape')
    await expect(page.getByText('Test Quest', { exact: true })).toBeHidden()
  })

  test('pressing Escape when no modal is open has no effect', async ({
    page,
  }) => {
    await page.keyboard.press('Escape')
    // The game UI should still be visible and stable
    await expect(page.locator('input[type="text"]')).toBeVisible()
  })

  test('Close button still works after Escape feature is added', async ({
    page,
  }) => {
    await openModal(page)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Test Quest', { exact: true })).toBeHidden()
  })
})

/* ------------------------------------------------------------------ */
/*  LoadDialog Escape key tests                                        */
/* ------------------------------------------------------------------ */

test.describe('LoadDialog – Escape key dismissal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('.loading-spinner')).toBeVisible({
      timeout: 10_000,
    })
    await injectMockGameState(page)
  })

  test('pressing Escape closes the Load dialog', async ({ page }) => {
    await page.getByRole('button', { name: '📂 Load' }).click()
    await expect(page.getByText('📂 Load Game', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('📂 Load Game', { exact: true })).toBeHidden()
  })

  test('Cancel button still works in Load dialog', async ({ page }) => {
    await page.getByRole('button', { name: '📂 Load' }).click()
    await expect(page.getByText('📂 Load Game', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('📂 Load Game', { exact: true })).toBeHidden()
  })
})

/* ------------------------------------------------------------------ */
/*  SaveDialog Escape key tests                                        */
/* ------------------------------------------------------------------ */

test.describe('SaveDialog – Escape key dismissal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('.loading-spinner')).toBeVisible({
      timeout: 10_000,
    })
    await injectMockGameState(page)
  })

  test('pressing Escape closes the Save dialog', async ({ page }) => {
    await page.getByRole('button', { name: '💾 Save' }).click()
    await expect(page.getByText('💾 Save Game', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('💾 Save Game', { exact: true })).toBeHidden()
  })

  test('pressing Escape with focus on a slot button closes the Save dialog', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '💾 Save' }).click()
    await expect(page.getByText('💾 Save Game', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Slot 1/ }).focus()
    await page.keyboard.press('Escape')
    await expect(page.getByText('💾 Save Game', { exact: true })).toBeHidden()
  })

  test('Cancel button still works in Save dialog', async ({ page }) => {
    await page.getByRole('button', { name: '💾 Save' }).click()
    await expect(page.getByText('💾 Save Game', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('💾 Save Game', { exact: true })).toBeHidden()
  })
})

/* ------------------------------------------------------------------ */
/*  Quest collapse/expand tests (desktop)                             */
/* ------------------------------------------------------------------ */

test.describe('Quest collapse/expand – desktop sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('.loading-spinner')).toBeVisible({
      timeout: 10_000,
    })
    await injectMockGameState(page)
  })

  test('quest description is hidden by default (collapsed)', async ({
    page,
  }) => {
    await expect(page.getByText('The Missing Amulet').first()).toBeVisible()
    await expect(page.getByText('Find it.')).toBeHidden()
  })

  test('clicking a quest expands its description', async ({ page }) => {
    await page.getByText('The Missing Amulet').first().click()
    await expect(page.getByText('Find it.').first()).toBeVisible()
  })

  test('clicking an expanded quest collapses it again', async ({ page }) => {
    await page.getByText('The Missing Amulet').first().click()
    await expect(page.getByText('Find it.').first()).toBeVisible()
    await page.getByText('The Missing Amulet').first().click()
    await expect(page.getByText('Find it.')).toBeHidden()
  })
})

/* ------------------------------------------------------------------ */
/*  Quest collapse/expand tests (mobile)                              */
/* ------------------------------------------------------------------ */

test.describe('Quest collapse/expand – mobile drawer', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('.loading-spinner')).toBeVisible({
      timeout: 10_000,
    })
    await injectMockGameState(page)
    // Open the mobile drawer
    await page.getByRole('button', { name: 'Open sidebar' }).click()
    await expect(page.getByText('Menu').first()).toBeVisible()
  })

  test('quest description is hidden by default in mobile drawer', async ({
    page,
  }) => {
    const drawer = page.getByTestId('mobile-drawer-panel')
    await expect(drawer.getByText('The Missing Amulet').first()).toBeVisible()
    await expect(drawer.getByText('Find it.')).toBeHidden()
  })

  test('clicking a quest in mobile drawer expands its description', async ({
    page,
  }) => {
    const drawer = page.getByTestId('mobile-drawer-panel')
    await drawer.getByText('The Missing Amulet').first().click()
    await expect(drawer.getByText('Find it.').first()).toBeVisible()
  })

  test('clicking an expanded quest in mobile drawer collapses it', async ({
    page,
  }) => {
    const drawer = page.getByTestId('mobile-drawer-panel')
    await drawer.getByText('The Missing Amulet').first().click()
    await expect(drawer.getByText('Find it.').first()).toBeVisible()
    await drawer.getByText('The Missing Amulet').first().click()
    await expect(drawer.getByText('Find it.')).toBeHidden()
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
