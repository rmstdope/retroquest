import {
  Spell,
  type Character,
  type GameState,
  type Item,
  characterName,
} from '@/engine'
import {
  FLAG_ACT4_BANNERS_SEEN,
  FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED,
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_TOWER_STAIR_OPEN,
} from '../Act4StoryFlags'
import { Whispers } from '../characters/Whispers'
import { Banners } from '../items/Banners'
import { MemoryOrbs } from '../items/MemoryOrbs'
import { Mirrors } from '../items/Mirrors'
import { WardStone } from '../items/WardStone'
import { WardStones } from '../items/WardStones'
import { Barriers } from '../items/Barriers'
import { Guardians } from '../items/Guardians'
import { FortressGates } from '../rooms/FortressGates'
import { TowerOfShadows } from '../rooms/TowerOfShadows'

/** The light on the Tower's shadows while the whispers hold the stair. */
const SHADOWS_LIT =
  'The shadows draw back from the light, a moment late, and come again as ' +
  'soon as it passes. They only ever follow you.'

/** The light on the Tower's shadows once the whispers are gone. */
const SHADOWS_LIT_STILL =
  'The light shows the steps and the shadows under them. They keep still now.'

/** The light on the whispers, which have nothing for it to fall on. */
const WHISPERS_LIT =
  'The light falls on the stair, and there is no one on it. The whispers go ' +
  'on from the empty air.'

/** The light on the banners before the sigil has been seen. */
const BANNERS_LIT =
  'The light climbs the banners and stops at the grime. Whatever is stitched ' +
  'beneath the dirt stays there.'

/** The light on the banners once the sigil has been seen. */
const BANNERS_LIT_KNOWN =
  'The light climbs the banners and shows the grime. You know now what is ' +
  'stitched beneath it.'

/** The light on the orbs while they are cracked. */
const ORBS_LIT =
  'The light goes into the cracked glass and comes out clouded. The scenes ' +
  'inside stay broken.'

/** The light on the orbs once they are whole. */
const ORBS_LIT_MENDED =
  'The light passes through the mended glass. The scenes inside hold well ' +
  'enough without it.'

/** The light on the mirrors while the maze stands. */
const MIRRORS_LIT =
  'Every mirror gives your light back. In every corridor another Elior holds ' +
  'up the same light, and the light does not say which of them is true.'

/** The light on the mirrors once they have gone dark. */
const MIRRORS_LIT_DARK =
  'The false mirrors stay dark, and your light dies in the glass.'

/** A spell that creates brilliant light to dispel darkness and shadow magic. */
export class Light extends Spell {
  constructor() {
    super({
      id: 'light',
      name: 'light',
      description: `The third thing ${characterName('Mira')} showed you: how to make a light.`,
    })
  }

  /** Give a save made before the Act IV wording review the current description. */
  override refreshSavedText(): void {
    this.description = new Light().description
  }

  /** Cast light spell without a specific target. */
  override castSpell(gameState: GameState): string {
    // Every room has a light hook; rooms without a special effect answer by default
    return gameState.currentRoom.light(gameState)
  }

  /** Cast light on an item: the gates' stones, guardians and barrier, and the banners, orbs and mirrors, each answer. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    const room = gameState.currentRoom
    if (room instanceof FortressGates) {
      if (targetItem instanceof WardStone) {
        return room.lightStone(gameState, targetItem)
      }
      if (targetItem instanceof WardStones) {
        return room.lightAllStones(gameState)
      }
      if (targetItem instanceof Guardians) return room.light(gameState)
      if (targetItem instanceof Barriers) return room.lightBarrier(gameState)
    }
    if (targetItem instanceof Banners) {
      return gameState.getStoryFlag(FLAG_ACT4_BANNERS_SEEN)
        ? BANNERS_LIT_KNOWN
        : BANNERS_LIT
    }
    if (targetItem instanceof MemoryOrbs) {
      return gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)
        ? ORBS_LIT_MENDED
        : ORBS_LIT
    }
    if (targetItem instanceof Mirrors) {
      return gameState.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)
        ? MIRRORS_LIT_DARK
        : MIRRORS_LIT
    }
    return 'The light shows it clearly, but has no special effect.'
  }

  /** The whispers have nothing for the light to fall on; anyone else, the default answer. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof Whispers) return WHISPERS_LIT
    return super.castOnCharacter(gameState, target)
  }

  /** In the Tower the stair and its shadows answer, though they are no items; elsewhere nothing does. */
  override castOnName(gameState: GameState, target: string): string | null {
    const room = gameState.currentRoom
    if (!(room instanceof TowerOfShadows)) return null
    if (room.namesStair(target)) return room.light(gameState)
    if (!room.namesShadows(target)) return null
    return gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)
      ? SHADOWS_LIT_STILL
      : SHADOWS_LIT
  }
}
