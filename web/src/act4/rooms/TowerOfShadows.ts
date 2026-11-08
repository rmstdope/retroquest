import { Room, type Exits, type GameState, clue } from '@/engine'
import { Whispers } from '../characters/Whispers'
import {
  FLAG_ACT4_TOWER_STAIR_OPEN,
  FLAG_ACT4_WHISPERS_CEDRIC_NAMED,
  FLAG_ACT4_WHISPERS_MIRA_NAMED,
  FLAG_ACT4_WHISPERS_NYX_NAMED,
} from '../Act4StoryFlags'

/** What the room description ends with once the whispers are gone. */
const STAIR_OPEN_SUFFIX =
  ' The whispers are gone. The stair winds up into the dark, and it is only ' +
  'a stair.'

/** What presses on Elior on the stair before any friend is named. */
const NO_NAME_HINT =
  'The whispers on the stair say that no one stayed with you. ' +
  'You know better, and so did Mira at the gate.'

/** What presses on Elior once a friend is named, before the third. */
const SOME_NAMED_HINT =
  'The whispers falter at the name of every friend who stayed. ' +
  'They are thinner now, but they still hold the stair.'

/**
 * A twisted tower where shadows take corporeal form and doubt runs rampant.
 *
 * Tests the player's resolve against psychological attacks: the whispers say
 * Elior's friends left him, and the stair opens once he has named all three
 * who stayed (Mira, Sir Cedric and Nyx) with the Loyalty Token in his pack.
 */
export class TowerOfShadows extends Room {
  constructor() {
    super({
      name: 'Tower of Shadows',
      description:
        'A stair winds up inside the black stone, narrow and dark. The walls ' +
        'are cold, and there are no windows. The shadows on the stair move a ' +
        'moment after you do. With every step, something quiet at your ear ' +
        'tells you why you should not have come.',
      items: [],
      characters: [new Whispers()],
      exits: { west: 'HallOfEchoes', up: 'ChamberOfWhispers' },
    })
  }

  /** Once the stair is open the description says the whispers are gone. */
  override descriptionFor(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)) {
      return this.description + STAIR_OPEN_SUFFIX
    }
    return this.description
  }

  /** The way back west is always open; the stair up once the friends are named. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)) {
      return { west: this.exits.west }
    }
    return { west: this.exits.west, up: this.exits.up }
  }

  /** The whispers block the stair until all three friends have been named. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'up') return null
    if (gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)) return null
    return clue(
      'You set your foot on the stair, and the whispers close in: ' +
        'your friends have left you, no one is coming, you were always alone. ' +
        'You stumble back down.',
    )
  }

  /**
   * The stair is no quest of its own, so the room says what presses on
   * Elior while the whispers hold it: before any name, and between the
   * first and the third. Nothing once the stair is open.
   */
  override hint(gameState: GameState): string | null {
    if (gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)) return null
    const named = [
      FLAG_ACT4_WHISPERS_MIRA_NAMED,
      FLAG_ACT4_WHISPERS_CEDRIC_NAMED,
      FLAG_ACT4_WHISPERS_NYX_NAMED,
    ].some((flag) => gameState.getStoryFlag(flag))
    return named ? SOME_NAMED_HINT : NO_NAME_HINT
  }
}
