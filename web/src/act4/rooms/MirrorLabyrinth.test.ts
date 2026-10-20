import { describe, it, expect } from 'vitest'
import { MirrorLabyrinth } from './MirrorLabyrinth'

describe('MirrorLabyrinth', () => {
  it('has the correct name', () => {
    const room = new MirrorLabyrinth()
    expect(room.name).toBe('Mirror Labyrinth')
  })
})
