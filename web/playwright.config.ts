import { defineConfig, devices } from '@playwright/test'

/**
 * The port the dev server under test listens on: `E2E_PORT` when set (the
 * fleet's `smoke-port` gives each worktree its own), 5173 otherwise.
 */
const PORT = Number(process.env.E2E_PORT ?? 5173)
const BASE_URL = `http://localhost:${PORT}`

/**
 * Playwright configuration for the end-to-end suite. The dev server is always
 * started by the run itself on {@link PORT} (`--strictPort`, never reused), so
 * a busy port fails loudly instead of testing another tree.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 0.0.0.0 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
