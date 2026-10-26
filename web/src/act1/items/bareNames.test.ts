import { describe, expect, it } from 'vitest'
import { EliorsJournal } from './EliorsJournal'
import { MothersLetter } from './MothersLetter'

describe('Act 1 items named after a person', () => {
  it('read without "the" in refusals', () => {
    expect(new EliorsJournal().nameInSentence()).toBe(
      "[item_name]Elior's Journal[/item_name]",
    )
    expect(new MothersLetter().nameInSentence()).toBe(
      "[item_name]Mother's Letter[/item_name]",
    )
  })
})
