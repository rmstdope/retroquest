import { describe, expect, it } from 'vitest'
import { EliorsJournal } from './EliorsJournal'

describe('Act 1 item named after a person', () => {
  it('reads without "the" in refusals', () => {
    expect(new EliorsJournal().nameInSentence()).toBe(
      "[item_name]Elior's Journal[/item_name]",
    )
  })
})
