import { describe, it, expect } from 'vitest'
import { nameActions } from './nameActions'

const HERE = {
  characters: ['grandmother'],
  items: ['bucket', 'lantern (lit)'],
  bag: ['bread', 'map'],
}

describe('nameActions', () => {
  it('offers talking to and examining a character who is here', () => {
    expect(nameActions('character', 'Grandmother', HERE)).toEqual([
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
})
