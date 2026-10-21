import { describe, it, expect } from 'vitest'
import { SilverLeaves } from './SilverLeaves'

describe('SilverLeaves', () => {
  it('keeps its description and hints that a healer would know their use', () => {
    const description = new SilverLeaves().description

    expect(description).toContain('Delicate leaves that shimmer')
    expect(
      description.endsWith('A healer would know what to do with these.'),
    ).toBe(true)
  })
})
