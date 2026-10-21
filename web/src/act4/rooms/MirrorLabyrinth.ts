import { Room, event, type Exits, type GameState } from '@/engine'
import { TrueSelf } from '../characters/TrueSelf'
import { Mirrors } from '../items/Mirrors'
import { ServantsPendant } from '../items/ServantsPendant'
import { TruthSight } from '../spells/TruthSight'
import {
  FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED,
  FLAG_ACT4_MAZE_OF_MIRRORS_STARTED,
} from '../Act4StoryFlags'

/** The labyrinth once its false mirrors have gone dark. */
const MAZE_AFTER_DESCRIPTION =
  'The false mirrors stand dark and silent now. A single clear corridor runs ' +
  'through the labyrinth to a plain mirror at its heart, where your own ' +
  'reflection waits, keeping still.'

/**
 * An enchanted maze where reality bends and truth becomes elusive.
 *
 * Tests the player's ability to discern truth from deception: the way through
 * is found by using the Echo Stone together with the Servant's Pendant.
 */
export class MirrorLabyrinth extends Room {
  constructor() {
    super({
      name: 'Mirror Labyrinth',
      description:
        'Mirrors. Everywhere, at every angle, and no two show the same thing. ' +
        'In one you are older. In one you never left Willowbrook. Corridors ' +
        'open in the glass and close again when you turn your head. Your ' +
        'reflections do not keep time with you; some of them are already ' +
        'walking away.',
      items: [new Mirrors()],
      characters: [],
      exits: { south: 'OuterCourtyard' },
    })
  }

  /** Entering the maze starts its side quest. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_STARTED, true)
  }

  /** Only the way back south is ever open. */
  override getExits(_gameState: GameState): Exits {
    return { south: this.exits.south }
  }

  /** Any other way walks into glass until the maze is solved. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (gameState.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)) return null
    if (!['north', 'east', 'west'].includes(direction)) return null
    return (
      '[failure]You step toward a corridor of light and walk straight into ' +
      'cold glass. Somewhere behind you, a reflection laughs.[/failure]'
    )
  }

  /**
   * Solve the maze with the Echo Stone and the Servant's Pendant: teaches
   * Truth Sight, completes the quest, clears the way and shows the True Self.
   * Called by both items, so every form of the command ends up here.
   */
  solve(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)) {
      return (
        '[dim]The true path is already clear. The false mirrors stay ' +
        'dark.[/dim]'
      )
    }
    const hasPendant = gameState.inventory.some(
      (item) => item instanceof ServantsPendant,
    )
    if (!hasPendant) {
      return (
        '[failure]The echoes whisper the way, but every step they name opens ' +
        'onto three more, all of them shining. You cannot tell which light is ' +
        'true. You wish the servants were here; they would know.[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED, true)
    gameState.learnSpell(new TruthSight())
    this.description = MAZE_AFTER_DESCRIPTION
    this.addCharacter(new TrueSelf())
    return event(
      "You hold the Echo Stone and the Servant's Pendant together. The echoes " +
        'whisper where to walk, and the pendant glows brighter at every true ' +
        'step. You walk only where your reflection does not follow. One by one ' +
        'the false mirrors darken, until a single corridor remains — and at ' +
        'its end, a plain mirror that shows you exactly as you are.',
    )
  }
}
