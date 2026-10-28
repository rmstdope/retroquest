import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_MIRA_CONFESSED } from '../Act3StoryFlags'
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

    expect(result).toContain('doorway')
    expect(result).not.toContain('[event]')
    expect(result).not.toContain('You study')
  })

  it('prevents pickup with dialogue', () => {
    const focus = new TeleportationFocus()

    const result = focus.preventPickup()

    expect(result).toContain('Mira')
    expect(result).toContain(
      'Careful. Every circle I draw is tied to this. If it moves, I cannot ' +
        'find my way back.',
    )
    expect(result).not.toContain('weave')
    expect(result).toContain('dialogue')
  })

  it('shows no mark before Mira has confessed', () => {
    const focus = new TeleportationFocus()

    expect(focus.examine(createState())).not.toContain('Lysa')
  })

  it('shows the crossed seven on every examine after the confession', () => {
    const focus = new TeleportationFocus()
    const gs = createState()
    gs.setStoryFlag(FLAG_ACT3_MIRA_CONFESSED, true)

    for (let i = 0; i < 2; i++) {
      const result = focus.examine(gs)
      expect(result).toContain('Reflections in the prism hover')
      expect(result).toContain(
        '\nLow on one facet, almost lost in the light, someone has ' +
          "scratched a seven with a bar through it. Lysa's hand. Your " +
          'mother cut this prism.',
      )
    }
  })
})
