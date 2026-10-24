import { Room, clue, dialogue, type Exits, type GameState } from '@/engine'
import { TrueSelf } from '../characters/TrueSelf'
import { EchoStone } from '../items/EchoStone'
import { Mirrors } from '../items/Mirrors'
import { TruthSight } from '../spells/TruthSight'
import {
  FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED,
  FLAG_ACT4_MAZE_OF_MIRRORS_STARTED,
} from '../Act4StoryFlags'

/** Where Elior stands in the maze: the entrance, after one turn, or the fork. */
type MazeStretch = 'entrance' | 'stretch' | 'fork'

/** The words of the echoes, which the Echo Stone repeats inside the maze. */
export const MAZE_ROUTE =
  'Left, then left, then the way your shadow does not go.'

/** What each stretch of the maze looks like. */
const STRETCH_DESCRIPTIONS: Record<MazeStretch, string> = {
  entrance:
    'Corridors of mirror run away from you in impossible directions, and in ' +
    'every one of them a different Elior looks back. You stand at the mouth ' +
    'of the maze, facing north.',
  stretch:
    'The corridor narrows and bends, and you face north again. Fewer ' +
    'reflections follow you here, and they walk a little behind.',
  fork:
    'The corridor ends in a last fork, facing north. To the north and to the ' +
    'east, your reflection waits in the glass, and both of them beckon.',
}

/** The labyrinth once its false mirrors have gone dark. */
const MAZE_AFTER_DESCRIPTION =
  'The false mirrors stand dark and silent now. A single clear corridor runs ' +
  'through the labyrinth to a plain mirror at its heart, where your own ' +
  'reflection waits, keeping still.'

/** A turn the maze does not allow: back to the entrance. */
const WRONG_TURN = clue(
  'You step toward a corridor of light and walk straight into ' +
    'cold glass. Somewhere behind you, a reflection laughs. You are back at ' +
    'the entrance.',
)

/** A turn taken without the Echo Stone: back to the entrance. */
const NO_STONE_TURN = clue(
  "You try to recall the echoes' words, but in here the glass " +
    'answers only with your own voice. You lose the way, and find yourself ' +
    'back at the entrance.',
)

/**
 * An enchanted maze where reality bends and truth becomes elusive.
 *
 * The maze is walked inside this one room. The route is three turns: west,
 * west, then the corridor the Servant's Pendant shows empty at the fork (always
 * east). Every turn needs the Echo Stone in the pack; a wrong turn, or a turn
 * without the stone, returns Elior to the entrance and forgets the pendant's
 * answer. `stretch` and `forkShown` are the maze's whole state and are saved
 * with the room.
 */
export class MirrorLabyrinth extends Room {
  /** Where Elior stands in the maze. */
  private stretch: MazeStretch = 'entrance'

  /** Whether the pendant has shown the empty corridor at this fork. */
  private forkShown = false

  constructor() {
    super({
      name: 'Mirror Labyrinth',
      description: STRETCH_DESCRIPTIONS.entrance,
      items: [new Mirrors()],
      characters: [],
      exits: { south: 'OuterCourtyard' },
    })
  }

  /** Entering the maze starts its side quest and always starts at the entrance. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_STARTED, true)
    this.resetToEntrance()
  }

  /** Whether the maze has been solved. */
  private isSolved(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)
  }

  /** Back to the entrance, forgetting what the pendant showed. */
  private resetToEntrance(): void {
    this.stretch = 'entrance'
    this.forkShown = false
  }

  /** Whether the Echo Stone is in the pack. */
  private hasStone(gameState: GameState): boolean {
    return gameState.inventory.some((item) => item instanceof EchoStone)
  }

  /** North, east and west lead on from the entrance and the first stretch; the fork has no west. */
  override getExits(gameState: GameState): Exits {
    if (this.isSolved(gameState)) return { south: this.exits.south }
    if (this.stretch === 'fork') {
      return {
        north: this.exits.south,
        east: this.exits.south,
        south: this.exits.south,
      }
    }
    return {
      north: this.exits.south,
      east: this.exits.south,
      west: this.exits.south,
      south: this.exits.south,
    }
  }

  /** The look of the stretch Elior stands in; the solved room has its own. */
  override descriptionFor(gameState: GameState): string {
    if (this.isSolved(gameState)) return this.description
    return STRETCH_DESCRIPTIONS[this.stretch]
  }

  /**
   * Takes over every turn (north, east, west) until the maze is solved: the
   * right turn moves one stretch on, the last one solves the maze, and any
   * other turn, or any turn without the Echo Stone, sends Elior back to the
   * entrance. South is left to the normal move.
   */
  override walk(gameState: GameState, direction: string): string | null {
    if (this.isSolved(gameState)) return null
    if (!['north', 'east', 'west'].includes(direction)) return null
    if (!this.hasStone(gameState)) return this.failTurn(NO_STONE_TURN)
    if (this.stretch === 'fork') {
      if (direction === 'east' && this.forkShown) return this.solve(gameState)
      return this.failTurn(WRONG_TURN)
    }
    if (direction !== 'west') return this.failTurn(WRONG_TURN)
    if (this.stretch === 'entrance') {
      this.stretch = 'stretch'
      return 'The glass lets you through.'
    }
    this.stretch = 'fork'
    return 'The glass lets you through again.'
  }

  /** Send Elior back to the entrance with the given failure line. */
  private failTurn(failure: string): string {
    this.resetToEntrance()
    return failure
  }

  /**
   * The last turn: teaches Truth Sight, completes the quest, takes the
   * after-description and shows the True Self.
   */
  private solve(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED, true)
    gameState.learnSpell(new TruthSight())
    this.description = MAZE_AFTER_DESCRIPTION
    this.addCharacter(new TrueSelf())
    return (
      'Behind you the false mirrors go ' +
      'dark, one by one, until a single corridor remains — and at its ' +
      'end, a plain mirror that shows you exactly as you are.\n' +
      'You learn [spell_name]Truth Sight[/spell_name].'
    )
  }

  /** The Echo Stone used in the maze repeats the route, never solves it. */
  useStone(_gameState: GameState): string {
    return (
      'In the Echo Stone one voice repeats, patient as a heartbeat:\n' +
      dialogue('an echo', `'${MAZE_ROUTE}'`)
    )
  }

  /**
   * The Servant's Pendant used in the maze: at the fork it shows the empty
   * corridor (once, then a reminder), before the fork there is nothing to
   * choose, and after the solving the way is already clear.
   */
  usePendant(gameState: GameState): string {
    if (this.isSolved(gameState)) {
      return (
        '[dim]The true path is already clear. The false mirrors stay ' +
        'dark.[/dim]'
      )
    }
    if (this.stretch !== 'fork') {
      return (
        "The pendant's light falls on the glass. Here every reflection walks " +
        'with you; there is nothing yet to choose between.'
      )
    }
    if (this.forkShown) {
      return (
        '[dim]Your reflection still walks the north corridor. The east ' +
        'corridor stays empty.[/dim]'
      )
    }
    this.forkShown = true
    return (
      "The pendant's blue light falls on the glass. In the north corridor " +
      'your reflection turns and walks with you. In the east corridor the ' +
      'glass stays empty.'
    )
  }
}
