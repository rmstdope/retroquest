import { Room, type Exits, type GameState, event } from '@/engine'
import { WardStoneFragment } from '../items/WardStoneFragment'
import { GuardiansChain } from '../items/GuardiansChain'
import { GuardiansEssence } from '../items/GuardiansEssence'
import { WardStones } from '../items/WardStones'
import { Barriers } from '../items/Barriers'
import {
  FLAG_ACT4_BARRIERS_DISABLED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
} from '../Act4StoryFlags'

/** The gates while the wall of light is up and the guardians are walking. */
const GATES_WALL_UP_DESCRIPTION =
  'The gates are black stone, cut square and fitted without a seam. Four ' +
  'ward stones stand before them at equal distances, each glowing the same ' +
  'steady violet, and a thin wall of the same light hangs across the ' +
  'gateway. Pale guardians walk the same short line between the stones, ' +
  'turn, and walk it back. Nothing here looks broken. Someone took great ' +
  'care over it.'

/** The gates while the wall of light is down and the guardians still walk. */
const GATES_WALL_DOWN_DESCRIPTION =
  'The gates are black stone, cut square and fitted without a seam. The ' +
  'violet wall is gone, but the four ward stones still glow, and the pale ' +
  'guardians still walk their short lines between them, turn, and walk them ' +
  'back, as if nothing has changed.'

/** The gates once the guardians are gone. */
const GATES_AFTER_DESCRIPTION =
  'The gates are black stone, cut square and fitted without a seam. The ward ' +
  'stones are dark now, and the paths between them are empty. The gates ' +
  'stand open.'

/**
 * The dark entrance to Malakar's fortress, protected by shadow guardians.
 *
 * First breach point requiring courage and light magic to overcome defenses:
 * ward stones must be examined and fragments used to disable barriers.
 */
export class FortressGates extends Room {
  private shadowGuardiansBanished = false

  constructor() {
    super({
      name: 'Fortress Gates',
      description: GATES_WALL_UP_DESCRIPTION,
      items: [
        new WardStoneFragment(),
        new GuardiansChain(),
        new WardStones(),
        new Barriers(),
      ],
      characters: [],
      exits: { north: 'HallOfEchoes', east: 'OuterCourtyard' },
    })
  }

  /**
   * The gates' look follows the story: the wall up, the wall down with the
   * guardians still walking, and the guardians gone. Derived from the story
   * flags, so a loaded game always shows the description that matches.
   */
  override descriptionFor(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)) {
      return GATES_AFTER_DESCRIPTION
    }
    if (gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
      return GATES_WALL_DOWN_DESCRIPTION
    }
    return GATES_WALL_UP_DESCRIPTION
  }

  /** The ways north and east open once the barrier is down. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) return {}
    return { north: this.exits.north, east: this.exits.east }
  }

  /** The barrier throws Elior back (and starts the quest). */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'north' && direction !== 'east') return null
    if (gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) return null
    gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
    return (
      '[failure]The violet wall gives under your hand, then pushes you back, ' +
      'gently and firmly. It hums in time with the ward stones.[/failure]'
    )
  }

  /** Cast light spell to dispel shadow guardians. */
  override light(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
      return (
        '[failure]Your light touches the nearest guardian and slides off it, ' +
        'like rain off a window. Behind it, the ward stones pulse once, all ' +
        'together.[/failure]'
      )
    }
    if (!this.shadowGuardiansBanished) {
      this.shadowGuardiansBanished = true
      gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, true)
      // Add Guardian's Essence to the room
      this.addItem(new GuardiansEssence())
      return event(
        'Your light fills the gateway. The guardians stop in the middle of ' +
          'their lines, as if someone had called them by name, and are gone. ' +
          'Where the last one stood, a small light the colour of a candle ' +
          'flame hangs above the ground: the ' +
          "[item_name]Guardian's Essence[/item_name].",
      )
    }
    return (
      "[dim]The guardians' paths are empty. There is nothing left here for " +
      'your light.[/dim]'
    )
  }
}
