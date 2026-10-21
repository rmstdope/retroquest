import { describe, it, expect } from 'vitest'
import { Act } from './Act'
import { Game } from './Game'
import type { GameState } from './GameState'
import { Room } from './Room'
import { Spell } from './Spell'

/** A room that labels its exit and speaks when entered. */
class Hall extends Room {
  override exitLabel(_gameState: GameState, direction: string): string | null {
    return direction === 'north' ? 'the way out' : null
  }
}

/** A room with text after the move line. */
class Yard extends Room {
  override enterText(_gameState: GameState): string {
    return 'The yard is wide.'
  }
}

/** A spell that answers a target that is neither item nor character. */
class Echo extends Spell {
  constructor() {
    super({ id: 'echo', name: 'echo', description: 'Echoes.' })
  }
  override castOnName(_gameState: GameState, target: string): string | null {
    return target === 'wall' ? 'The wall echoes.' : null
  }
}

/** An act with its own words for the unknown and the completion hook. */
class HookAct extends Act {
  override unknownSpell(_gameState: GameState, name: string): string | null {
    return name === 'lost' ? 'That magic is gone.' : null
  }
  override getCompletionHook(gameState: GameState): string {
    return `Hook in ${gameState.currentRoom.name}`
  }
}

function makeGame(): Game {
  const hall = new Hall({
    name: 'Hall',
    description: 'A hall.',
    exits: { north: 'Yard' },
  })
  const yard = new Yard({ name: 'Yard', description: 'A yard.' })
  const act = new HookAct({
    name: 'TestAct',
    rooms: { Hall: hall, Yard: yard },
    quests: [],
    musicFile: '',
    musicInfo: '',
  })
  const game = new Game([act])
  game.state.knownSpells = [new Echo()]
  return game
}

describe('engine hooks', () => {
  it('shows an exit label in the description and the controller-facing exits', () => {
    const game = makeGame()
    expect(game.state.currentRoom.describe(game.state)).toContain(
      '[exits]north[/exits] (the way out)',
    )
  })

  it('appends the entered room’s text after the move line', () => {
    const game = makeGame()
    expect(game.move('north')).toBe(
      '[event]You move north to [room_name]Yard[/room_name].[/event]\n\nThe yard is wide.',
    )
  })

  it('lets a spell answer a target that is not an item or character', () => {
    const game = makeGame()
    expect(game.cast('echo on wall')).toBe('The wall echoes.')
    expect(game.cast('echo on nothing')).toContain("You don't see a 'nothing'")
  })

  it('lets the act word a spell the player does not know', () => {
    const game = makeGame()
    expect(game.cast('lost')).toBe('That magic is gone.')
    expect(game.cast('other')).toContain("You don't know any spell called")
  })

  it('passes the finished act’s state to the completion hook', () => {
    const game = makeGame()
    expect(game.acts[0].getCompletionHook(game.state)).toBe('Hook in Hall')
  })
})
