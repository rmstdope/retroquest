/** The arrow over an open way out. */
import { describe, expect, it } from 'vitest'
import { wayCursor } from './wayCursor'

describe('wayCursor', () => {
  it('gives each compass way its own arrow and falls back to the ordinary pointer', () => {
    const cursors = ['north', 'east', 'south', 'west'].map(wayCursor)
    expect(new Set(cursors).size).toBe(4)
    for (const cursor of cursors) {
      expect(cursor).toMatch(/^url\("data:image\/svg\+xml,.+"\) 16 16, /)
      expect(cursor).toContain(encodeURIComponent('#ffc14d'))
    }
  })

  it('gives up, down and any other way a sign of their own', () => {
    const all = [
      'north',
      'east',
      'south',
      'west',
      'up',
      'down',
      'secret_passage',
    ]
    expect(new Set(all.map(wayCursor)).size).toBe(7)
    expect(wayCursor('in')).toBe(wayCursor('secret_passage'))
  })
})
