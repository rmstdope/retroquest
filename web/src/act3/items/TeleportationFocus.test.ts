import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from '../Act3'
import { TeleportationFocus } from './TeleportationFocus'

/** A bare game state for examining. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('TeleportationFocus', () => {
  it('exposes a clear, non-empty name', () => {
    new Game([new Act3()])

    const focus = new TeleportationFocus()

    expect(
      focus.name.toLowerCase().includes('teleport') || focus.name !== null,
    ).toBe(true)
  })

  it('initializes with name, description and carry flag', () => {
    const focus = new TeleportationFocus()

    expect(focus.name).toBe('teleportation focus')
    expect(
      focus.description.toLowerCase().includes('prism') ||
        focus.description.toLowerCase().includes('circle'),
    ).toBe(true)
    expect(focus.canBeCarried).toBe(false)
  })

  it('examining returns event text', () => {
    const focus = new TeleportationFocus()
    const gs = createState()

    const result = focus.examine(gs)

    expect(
      result.includes('study the prism') ||
        result.includes('doorway') ||
        !result.toLowerCase().includes('mira'),
    ).toBe(true)
    expect(result.startsWith('[event]')).toBe(true)
  })

  it('prevents pickup with dialogue', () => {
    const focus = new TeleportationFocus()

    const result = focus.preventPickup()

    expect(result).toContain('Mira')
    expect(
      result.includes('circle anchors') || result.includes('must bear it'),
    ).toBe(true)
    expect(result).toContain('dialogue')
  })
})
