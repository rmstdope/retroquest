import { describe, it, expect } from 'vitest'
import { uiModeFromSearch } from './useUiMode'

describe('uiModeFromSearch', () => {
  it('is lantern for ?ui=lantern', () => {
    expect(uiModeFromSearch('?ui=lantern')).toBe('lantern')
  })

  it('ignores case and other parameters', () => {
    expect(uiModeFromSearch('?debug=1&ui=Lantern')).toBe('lantern')
  })

  it('is classic otherwise', () => {
    expect(uiModeFromSearch('')).toBe('classic')
    expect(uiModeFromSearch('?ui=classic')).toBe('classic')
    expect(uiModeFromSearch('?ui=other')).toBe('classic')
  })
})
