import { describe, expect, it } from 'vitest'
import { NyxToken } from './NyxToken'
import { SquiresDiary } from './SquiresDiary'
import { TravelersJournal } from './TravelersJournal'

describe('Act 2 items named after a person', () => {
  it('read without "the" in refusals', () => {
    expect(new NyxToken().nameInSentence()).toBe(
      "[item_name]Nyx's Token[/item_name]",
    )
    expect(new SquiresDiary().nameInSentence()).toBe(
      "[item_name]Squire's Diary[/item_name]",
    )
    expect(new TravelersJournal().nameInSentence()).toBe(
      "[item_name]Traveler's Journal[/item_name]",
    )
  })
})
