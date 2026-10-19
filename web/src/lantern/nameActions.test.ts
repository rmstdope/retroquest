import { describe, it, expect } from 'vitest'
import { nameActions } from './nameActions'

const HERE = {
  characters: ['grandmother'],
  items: ['bucket', 'lantern (lit)', "Elior's Journal", 'chicken'],
  bag: ['bread', 'map'],
  spells: ['light'],
  shortNames: { journal: "Elior's Journal", hoe: 'Rusty Hoe' },
}

describe('nameActions', () => {
  it('offers talking to and examining a character who is here', () => {
    const emptyHanded = { ...HERE, bag: [], spells: [] }
    expect(nameActions('character', 'Grandmother', emptyHanded)).toEqual([
      { label: 'Talk to', command: 'talk to grandmother' },
      { label: 'Examine', command: 'examine grandmother' },
    ])
  })

  it('offers taking and examining an item in the room', () => {
    expect(nameActions('item', 'Lantern (lit)', HERE)).toEqual([
      { label: 'Take', command: 'take lantern (lit)' },
      { label: 'Examine', command: 'examine lantern (lit)' },
    ])
  })

  it('offers using, dropping and examining an item in the bag', () => {
    expect(nameActions('item', 'bread', HERE)).toEqual([
      { label: 'Use', command: 'use bread' },
      { label: 'Drop', command: 'drop bread' },
      { label: 'Examine', command: 'examine bread' },
    ])
  })

  it('offers nothing for something that is not here', () => {
    expect(nameActions('character', 'Mira', HERE)).toEqual([])
    expect(nameActions('item', 'sword', HERE)).toEqual([])
  })

  it("knows an item by the story's short name", () => {
    expect(nameActions('item', 'journal', HERE)).toEqual([
      { label: 'Take', command: "take elior's journal" },
      { label: 'Examine', command: "examine elior's journal" },
    ])
  })

  it('knows an item named in the plural', () => {
    expect(nameActions('item', 'chickens', HERE)[0]).toEqual({
      label: 'Take',
      command: 'take chicken',
    })
  })

  it('offers giving something from the bag and casting a spell on a character', () => {
    expect(nameActions('character', 'Grandmother', HERE)).toEqual([
      { label: 'Talk to', command: 'talk to grandmother' },
      {
        label: 'Give…',
        choices: [
          { label: 'Bread', command: 'give bread to grandmother' },
          { label: 'Map', command: 'give map to grandmother' },
        ],
      },
      {
        label: 'Cast…',
        choices: [{ label: 'Light', command: 'cast light on grandmother' }],
      },
      { label: 'Examine', command: 'examine grandmother' },
    ])
  })
})
