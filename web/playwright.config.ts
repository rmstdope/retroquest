import { defineConfig, devices } from '@playwright/test'

/**
 * The port the dev server under test listens on: `E2E_PORT` when set (the
 * fleet's `smoke-port` gives each worktree its own block), 5173 when it is
 * unset or empty. The production preview listens on the next port. Any other
 * value that is not a port stops the run with its name.
 */
const PORT = parsePort(process.env.E2E_PORT)
const PREVIEW_PORT = PORT + 1
const DEV_URL = `http://localhost:${PORT}`
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`

/**
 * The specs that drive the dev-only `debug <script>` command, which a
 * production build does not carry. They run against the dev server; every
 * other spec runs against the production build.
 */
const DEV_ONLY_SPECS = [
  'debug.spec.ts',
  'redLine.spec.ts',
  'roomTitle.spec.ts',
  'biggerMap.spec.ts',
]

/** Reads `E2E_PORT`, defaulting to 5173 and rejecting a value that is not a usable port. */
function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw === '') {
    return 5173
  }
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65534) {
    throw new Error(`E2E_PORT="${raw}" is not a port`)
  }
  return port
}

/** Browser storage for a project: narration is at volume 0 unless a spec turns it up. */
function storageFor(origin: string): {
  cookies: []
  origins: { origin: string; localStorage: { name: string; value: string }[] }[]
} {
  return {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [
          {
            name: 'retroquest_settings',
            value: JSON.stringify({ narrationVolume: 0 }),
          },
        ],
      },
    ],
  }
}

/**
 * Playwright configuration for the end-to-end suite. Two servers are started
 * by the run itself (`--strictPort`, never reused, so a busy port fails loudly
 * instead of testing another tree): the production build served by
 * `vite preview` for the `chromium` project, and the dev server for the
 * `chromium-dev` project (the specs in {@link DEV_ONLY_SPECS}). In CI the
 * specs run in parallel and a test that passes only on its retry fails the
 * run (`failOnFlakyTests`) instead of going green unnoticed.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: !!process.env.CI,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  timeout: 30_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    trace: 'on-first-retry',
    // The title screen's opening plays for about 5½ s; the specs that press
    // Start do not wait it out. Specs that need motion switch it back on.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: DEV_ONLY_SPECS,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: PREVIEW_URL,
        storageState: storageFor(PREVIEW_URL),
      },
    },
    {
      name: 'chromium-dev',
      testMatch: DEV_ONLY_SPECS,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: DEV_URL,
        storageState: storageFor(DEV_URL),
      },
    },
  ],
  webServer: [
    {
      command: `npm run build && npm run preview -- --host 0.0.0.0 --port ${PREVIEW_PORT} --strictPort`,
      url: PREVIEW_URL,
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: `npm run dev -- --host 0.0.0.0 --port ${PORT} --strictPort`,
      url: DEV_URL,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
})
