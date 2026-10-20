/**
 * Tests for the Playwright configuration: the dev server port comes from
 * `E2E_PORT` (5173 when unset), and a run never reuses a server it did not
 * start, so parallel worktrees each test their own tree.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PlaywrightTestConfig } from '@playwright/test'

/** Loads a fresh copy of the config, so `E2E_PORT` is read again. */
async function loadConfig(): Promise<PlaywrightTestConfig> {
  vi.resetModules()
  const module = await import('./playwright.config')
  return module.default
}

/** Returns the single `webServer` entry the config declares. */
function webServerOf(
  config: PlaywrightTestConfig,
): Exclude<PlaywrightTestConfig['webServer'], unknown[] | undefined> {
  const server = config.webServer
  if (server === undefined || Array.isArray(server)) {
    throw new Error('expected exactly one webServer entry')
  }
  return server
}

describe('playwright.config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses E2E_PORT for the base URL, the server URL and the dev command', async () => {
    vi.stubEnv('E2E_PORT', '5231')
    const config = await loadConfig()
    const server = webServerOf(config)
    expect(config.use?.baseURL).toBe('http://localhost:5231')
    expect(server.url).toBe('http://localhost:5231')
    expect(server.command).toContain('--port 5231')
    expect(server.command).toContain('--strictPort')
  })

  it('falls back to port 5173 when E2E_PORT is unset', async () => {
    vi.stubEnv('E2E_PORT', undefined)
    const config = await loadConfig()
    const server = webServerOf(config)
    expect(config.use?.baseURL).toBe('http://localhost:5173')
    expect(server.url).toBe('http://localhost:5173')
    expect(server.command).toContain('--port 5173')
  })

  it('never reuses a server that is already running', async () => {
    vi.stubEnv('CI', '')
    const config = await loadConfig()
    expect(webServerOf(config).reuseExistingServer).toBe(false)
  })
})
