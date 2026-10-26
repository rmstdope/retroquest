import { describe, it, expect } from 'vitest'
import { NyxToken } from './NyxToken'

describe('NyxToken', () => {
  it('is named after a person, so it takes no "the" and keeps its capitals', () => {
    const token = new NyxToken()
    expect(token.nameInSentence()).toBe("[item_name]Nyx's Token[/item_name]")
    expect(token.nameInSentence({ atStart: true })).toBe(
      "[item_name]Nyx's Token[/item_name]",
    )
  })
})
