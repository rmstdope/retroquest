import { describe, it, expect } from 'vitest'
import { displayName } from './displayName'

describe('displayName', () => {
  it('capitalises each word of an engine name', () => {
    expect(displayName('grandmother')).toBe('Grandmother')
    expect(displayName('innkeeper marcus')).toBe('Innkeeper Marcus')
  })

  it('turns underscores into spaces (spell ids)', () => {
    expect(displayName('greater_heal')).toBe('Greater Heal')
    expect(displayName('nature_sense')).toBe('Nature Sense')
  })

  it('keeps hyphenated parts and existing capitals readable', () => {
    expect(displayName('tide-born guardian')).toBe('Tide-Born Guardian')
    expect(displayName("Dragon's Hall")).toBe("Dragon's Hall")
  })

  it('collapses extra spaces', () => {
    expect(displayName('  water   nymphs ')).toBe('Water Nymphs')
  })
})
