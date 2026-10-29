import { describe, it, expect } from 'vitest'
import { SilverLeaves } from './SilverLeaves'

describe('SilverLeaves', () => {
  it('keeps its description and hints that a healer would know their use', () => {
    const description = new SilverLeaves().description

    expect(description).toContain('Leaves from the silver-barked tree')
    expect(
      description.endsWith('A healer would know what to do with these.'),
    ).toBe(true)
  })
})
