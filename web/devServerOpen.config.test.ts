/**
 * Tests for the dev-server "open the page" decision: only a start by a person
 * at a terminal opens a browser tab; agents, scripts, CI and the end-to-end
 * run (all without a terminal) stay silent.
 */
import { describe, expect, it } from 'vitest'
import { shouldOpenBrowser } from './devServerOpen.config'

describe('shouldOpenBrowser', () => {
  it('opens the page for a start from a terminal', () => {
    expect(shouldOpenBrowser({}, true)).toBe(true)
  })

  it('stays silent when output is not a terminal', () => {
    expect(shouldOpenBrowser({}, false)).toBe(false)
    expect(shouldOpenBrowser({}, undefined)).toBe(false)
  })

  it('stays silent in CI even from a terminal', () => {
    expect(shouldOpenBrowser({ CI: 'true' }, true)).toBe(false)
  })

  it('honours BROWSER=none', () => {
    expect(shouldOpenBrowser({ BROWSER: 'none' }, true)).toBe(false)
  })

  it('treats an empty CI as unset', () => {
    expect(shouldOpenBrowser({ CI: '' }, true)).toBe(true)
  })
})
