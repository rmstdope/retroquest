import { Room, type Exits, type GameState, clue } from '@/engine'
import { Whispers } from '../characters/Whispers'
import {
  FLAG_ACT4_TOWER_STAIR_OPEN,
  FLAG_ACT4_WHISPERS_CEDRIC_NAMED,
  FLAG_ACT4_WHISPERS_MIRA_NAMED,
  FLAG_ACT4_WHISPERS_NYX_NAMED,
} from '../Act4StoryFlags'

/** The stair itself, which the whispers do not change. */
const STAIR =
  'A stair winds up inside the black stone, narrow and dark. The walls ' +
  'are cold, and there are no windows.'

/** The whole description once the whispers are gone. */
const STAIR_OPEN =
  STAIR +
  ' The whispers are gone. The stair winds up into the dark, and it is only ' +
  'a stair.'

/** What the stair answers to, though it is no item in the room. */
const STAIR_NAMES = ['stair', 'stairs']

/** What the shadows on the stair answer to, though they are no item either. */
const SHADOW_NAMES = ['shadows', 'shadow']

/** The light on the stair while the whispers hold it. */
const STAIR_LIT =
  'The light runs up the stair as far as the first turn. The shadows draw ' +
  'back from it, a moment late. The whispers go on, no quieter.'

/** The light on the stair once the whispers are gone. */
const STAIR_LIT_OPEN =
  'The light runs up the stair as far as the first turn. It is only a stair.'

/** What presses on Elior on the stair before any friend is named. */
const NO_NAME_HINT =
  'The whispers on the stair say that no one stayed with you. ' +
  'You know better, and so does Mira at the gate.'

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
        STAIR +
        ' The shadows on the stair move a moment after you do. With every ' +
        'step, something quiet at your ear tells you why you should not have ' +
        'come.',
      items: [],
      characters: [new Whispers()],
      exits: { west: 'HallOfEchoes', up: 'ChamberOfWhispers' },
    })
  }

  /**
   * Once the stair is open the description says the whispers are gone, in
   * place of the lines about them.
   */
  override descriptionFor(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)) return STAIR_OPEN
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

  /** There is no window on the stair, so the light does show it; the whispers do not care. */
  override light(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)
      ? STAIR_LIT_OPEN
      : STAIR_LIT
  }

  /** Whether a name typed as a spell's target means the stair. */
  namesStair(name: string): boolean {
    return STAIR_NAMES.includes(name)
  }

  /** Whether a name typed as a spell's target means the shadows on the stair. */
  namesShadows(name: string): boolean {
    return SHADOW_NAMES.includes(name)
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
