import { characterName, Room, type GameState } from '@/engine'
import { Rope } from '../items/Rope'
import { Apple } from '../items/Apple'
import { Matches } from '../items/Matches'
import { Armor } from '../items/Armor'
import { Sword } from '../items/Sword'
import { Shopkeeper } from '../characters/Shopkeeper'
import {
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
  TRIGGER_PATCHES_RETURNS,
} from '../Act1StoryFlags'

const SHUT_TEXT =
  'A cluttered shop with the shutters half down. Rope, apples, matches and ' +
  'trinkets crowd the shelves in the gloom. ' +
  `${characterName('Hemlock')} stands at the window, watching the lane.`
const OPEN_TEXT =
  'A cluttered shop. Rope, apples, matches and trinkets crowd the shelves, ' +
  'and the air smells of fruit, wax and old wood. ' +
  `${characterName('Hemlock')} dusts jars between customers`
const CAT_CLAUSE =
  ', and every so often looks at the counter, where his cat sleeps'

/**
 * General Store room: early merchant hub with multi-category items.
 *
 * The description follows whether Hemlock has the store shut or open (the
 * same story flags as the Shopkeeper); `descriptionFor` computes it each time
 * the room is shown.
 */
export class GeneralStore extends Room {
  /** The sound state of the store once Patches sleeps on the counter. */
  static readonly SOUND_CAT_HOME = 'cat-home'

  constructor() {
    super({
      name: 'General Store',
      description: SHUT_TEXT,
      items: [new Rope(), new Apple(), new Matches(), new Sword(), new Armor()],
      characters: [new Shopkeeper()],
      exits: { west: 'VillageSquare', south: 'BlacksmithsForge' },
    })
  }

  /** Purrs with the cat once Patches was carried home; otherwise the plain store. */
  override soundState(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_PATCHES_RETURNED)
      ? GeneralStore.SOUND_CAT_HOME
      : ''
  }

  /** The room's sound states, the one it starts in first. */
  override soundStates(): readonly string[] {
    return ['', GeneralStore.SOUND_CAT_HOME]
  }

  /** The sound triggers the store can fire. */
  override soundTriggers(): readonly string[] {
    return [TRIGGER_PATCHES_RETURNS]
  }

  /**
   * The shut shop while Patches is missing; once the store is open, the busy
   * shop, with the sleeping cat only when Patches was carried home.
   */
  override descriptionFor(gameState: GameState): string {
    const catHome = gameState.getStoryFlag(FLAG_PATCHES_RETURNED)
    const open =
      catHome ||
      gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER) ||
      gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    if (!open) return SHUT_TEXT
    return OPEN_TEXT + (catHome ? CAT_CLAUSE : '') + '.'
  }
}
