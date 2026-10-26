import { describe, expect, it } from 'vitest'
import { nameInSentence } from './names'

describe('nameInSentence', () => {
  it('title-cases a character name wherever it stands', () => {
    expect(nameInSentence('character', 'barmaid elena')).toBe(
      '[character_name]Barmaid Elena[/character_name]',
    )
    expect(
      nameInSentence('character', 'barmaid elena', { atStart: true }),
    ).toBe('[character_name]Barmaid Elena[/character_name]')
  })

  it('keeps the minor words of a title lower case', () => {
    expect(nameInSentence('character', 'captain of the guard')).toBe(
      '[character_name]Captain of the Guard[/character_name]',
    )
  })

  it('gives a common-noun character "the" and keeps it lower case', () => {
    expect(nameInSentence('character', 'merchant', { common: true })).toBe(
      'the [character_name]merchant[/character_name]',
    )
    expect(
      nameInSentence('character', 'merchant', { common: true, atStart: true }),
    ).toBe('The [character_name]merchant[/character_name]')
  })

  it('gives an item "the" mid-sentence and "The" at the start', () => {
    expect(nameInSentence('item', 'rock')).toBe(
      'the [item_name]rock[/item_name]',
    )
    expect(nameInSentence('item', 'rock', { atStart: true })).toBe(
      'The [item_name]rock[/item_name]',
    )
  })

  it('gives a bare item name no article and its capitals', () => {
    expect(nameInSentence('item', "nyx's token", { bare: true })).toBe(
      "[item_name]Nyx's Token[/item_name]",
    )
    expect(
      nameInSentence('item', "nyx's token", { bare: true, atStart: true }),
    ).toBe("[item_name]Nyx's Token[/item_name]")
  })

  it('keeps "the" before a possessive that is not a person\'s own name', () => {
    expect(nameInSentence('item', "dragon's scale")).toBe(
      "the [item_name]dragon's scale[/item_name]",
    )
    expect(nameInSentence('room', "Blacksmith's Forge")).toBe(
      "the [room_name]Blacksmith's Forge[/room_name]",
    )
    expect(nameInSentence('room', "Entrance to Malakar's Fortress")).toBe(
      "the [room_name]Entrance to Malakar's Fortress[/room_name]",
    )
  })

  it('drops the "The" of a room name it puts "the" before', () => {
    expect(nameInSentence('room', 'The Old Mill')).toBe(
      'the [room_name]Old Mill[/room_name]',
    )
    expect(nameInSentence('room', 'The Old Mill', { atStart: true })).toBe(
      'The [room_name]Old Mill[/room_name]',
    )
  })

  it('gives a bare room name no article', () => {
    expect(nameInSentence('room', "Mira's Hut", { bare: true })).toBe(
      "[room_name]Mira's Hut[/room_name]",
    )
  })
})
