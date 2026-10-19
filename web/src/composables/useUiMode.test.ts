import { describe, it, expect } from 'vitest'
import { uiModeFromSearch } from './useUiMode'

describe('uiModeFromSearch', () => {
  it('is lantern by default', () => {
    expect(uiModeFromSearch('')).toBe('lantern')
    expect(uiModeFromSearch('?ui=lantern')).toBe('lantern')
    expect(uiModeFromSearch('?ui=other')).toBe('lantern')
  })

  it('is classic for ?ui=classic', () => {
    expect(uiModeFromSearch('?ui=classic')).toBe('classic')
  })

  it('ignores case and other parameters', () => {
    expect(uiModeFromSearch('?debug=1&ui=Classic')).toBe('classic')
  })
})
