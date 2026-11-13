/**
 * Tests for the Playwright configuration: the dev server port comes from
 * `E2E_PORT` (5173 when unset) and the production preview takes the next
 * port; a run never reuses a server it did not start, so parallel worktrees
 * each test their own tree; the specs that need the dev-only `debug` command
 * stay on the dev server; and CI runs in parallel and fails on a test that
 * passes only on its retry.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PlaywrightTestConfig } from '@playwright/test'

/** Loads a fresh copy of the config, so `E2E_PORT` and `CI` are read again. */
async function loadConfig(): Promise<PlaywrightTestConfig> {
  vi.resetModules()
  const module = await import('./playwright.config')
  return module.default
}

/** The `webServer` entries the config declares, as a list. */
function serversOf(
  config: PlaywrightTestConfig,
): { command: string; url?: string; reuseExistingServer?: boolean }[] {
  const server = config.webServer
  if (server === undefined) {
    throw new Error('expected webServer entries')
  }
  return Array.isArray(server) ? server : [server]
}

/** The project called `name`. */
function projectOf(config: PlaywrightTestConfig, name: string) {
  const project = config.projects?.find((p) => p.name === name)
  if (project === undefined) {
    throw new Error(`expected a project called ${name}`)
  }
  return project
}

describe('playwright.config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('serves the dev server on E2E_PORT and the production preview on the next port', async () => {
    vi.stubEnv('E2E_PORT', '5231')
    const config = await loadConfig()
    const [preview, dev] = serversOf(config)
    expect(preview.url).toBe('http://localhost:5232')
    expect(preview.command).toContain('npm run build')
    expect(preview.command).toContain('npm run preview')
    expect(preview.command).toContain('--port 5232')
    expect(preview.command).toContain('--strictPort')
    expect(dev.url).toBe('http://localhost:5231')
    expect(dev.command).toContain('npm run dev')
    expect(dev.command).toContain('--port 5231')
    expect(dev.command).toContain('--strictPort')
  })

  it('points each project at its own server', async () => {
    vi.stubEnv('E2E_PORT', '5231')
    const config = await loadConfig()
    expect(projectOf(config, 'chromium').use?.baseURL).toBe(
      'http://localhost:5232',
    )
    expect(projectOf(config, 'chromium-dev').use?.baseURL).toBe(
      'http://localhost:5231',
    )
  })

  it('keeps the specs that use the dev-only debug command on the dev server', async () => {
    const config = await loadConfig()
    const devSpecs = projectOf(config, 'chromium-dev').testMatch
    expect(devSpecs).toEqual(
      expect.arrayContaining([
        'debug.spec.ts',
        'redLine.spec.ts',
        'roomTitle.spec.ts',
        'biggerMap.spec.ts',
      ]),
    )
    expect(projectOf(config, 'chromium').testIgnore).toEqual(devSpecs)
  })

  it('falls back to port 5173 when E2E_PORT is unset', async () => {
    vi.stubEnv('E2E_PORT', undefined)
    const config = await loadConfig()
    expect(serversOf(config)[1].url).toBe('http://localhost:5173')
    expect(projectOf(config, 'chromium-dev').use?.baseURL).toBe(
      'http://localhost:5173',
    )
  })

  it('falls back to port 5173 when E2E_PORT is empty', async () => {
    vi.stubEnv('E2E_PORT', '')
    const config = await loadConfig()
    expect(projectOf(config, 'chromium-dev').use?.baseURL).toBe(
      'http://localhost:5173',
    )
  })

  it('names a value of E2E_PORT that is not a port', async () => {
    vi.stubEnv('E2E_PORT', 'abc')
    await expect(loadConfig()).rejects.toThrow('E2E_PORT="abc" is not a port')
  })

  it('never reuses a server that is already running', async () => {
    vi.stubEnv('CI', '')
    const config = await loadConfig()
    for (const server of serversOf(config)) {
      expect(server.reuseExistingServer).toBe(false)
    }
  })

  it('runs in parallel in CI and fails on a test that passes only on retry', async () => {
    vi.stubEnv('CI', '1')
    const config = await loadConfig()
    expect(config.fullyParallel).toBe(true)
    expect(config.workers).toBeGreaterThan(1)
    expect(config.failOnFlakyTests).toBe(true)
  })

  it('runs one test at a time and without retries outside CI', async () => {
    vi.stubEnv('CI', '')
    const config = await loadConfig()
    expect(config.fullyParallel).toBe(false)
    expect(config.workers).toBe(1)
    expect(config.retries).toBe(0)
    expect(config.failOnFlakyTests).toBe(false)
  })
})
