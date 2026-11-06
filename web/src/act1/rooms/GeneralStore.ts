import { characterName, Room, type GameState } from '@/engine'
import { Rope } from '../items/Rope'
import { Apple } from '../items/Apple'
import { Matches } from '../items/Matches'
import { Armor } from '../items/Armor'
import { Sword } from '../items/Sword'
import { Scenery } from '../items/Scenery'
import { Shopkeeper } from '../characters/Shopkeeper'
import {
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
  TRIGGER_PATCHES_RETURNS,
} from '../Act1StoryFlags'

const SHELVES_WITH_ROPE = 'Rope, apples and trinkets'
const SHELVES_WITHOUT_ROPE = 'Apples and trinkets'

/** The shut shop, its shelves named as they stand. */
function shutText(shelves: string): string {
  return (
    `A cluttered shop with the shutters half down. ${shelves} ` +
    'crowd the shelves in the gloom. ' +
    `${characterName('Hemlock')} stands at the window, ` +
    'watching the lane to the chapel.'
  )
}

/** The open shop, its shelves named as they stand, before the cat clause. */
function openText(shelves: string): string {
  return (
    `A cluttered shop. ${shelves} crowd the shelves, ` +
    'and the air smells of fruit, wax and old wood. ' +
    'Outside, the lane runs east to the chapel. ' +
    `${characterName('Hemlock')} dusts jars between customers`
  )
}

const CAT_CLAUSE =
  ', and every so often looks at the counter, where his cat sleeps'

/**
 * General Store room: early merchant hub with multi-category items.
 *
 * The description follows whether Hemlock has the store shut or open (the
 * same story flags as the Shopkeeper), and names rope on the shelves only
 * while his one rope is still on display; `descriptionFor` computes it each
 * time the room is shown.
 */
export class GeneralStore extends Room {
  /** The sound state of the store once Patches sleeps on the counter. */
  static readonly SOUND_CAT_HOME = 'cat-home'

  constructor() {
    super({
      name: 'General Store',
      description: shutText(SHELVES_WITH_ROPE),
      items: [
        new Rope(),
        new Apple(),
        new Matches(),
        new Sword(),
        new Armor(),
        ...Scenery.forRoom('GeneralStore'),
      ],
      characters: [new Shopkeeper()],
      exits: {
        west: 'VillageSquare',
        east: 'VillageChapel',
        south: 'BlacksmithsForge',
      },
    })
  }

  /** Give a save made before the lane to the chapel the store's current ways out. */
  override refreshSavedText(): void {
    this.exits = new GeneralStore().exits
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
   * shop, with the sleeping cat only when Patches was carried home. Rope is
   * named on the shelves only while Hemlock's rope is still on display there.
   */
  override descriptionFor(gameState: GameState): string {
    const shelves = this.items.some((item) => Rope.isOnDisplay(item))
      ? SHELVES_WITH_ROPE
      : SHELVES_WITHOUT_ROPE
    const catHome = gameState.getStoryFlag(FLAG_PATCHES_RETURNED)
    const open =
      catHome ||
      gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER) ||
      gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    if (!open) return shutText(shelves)
    return openText(shelves) + (catHome ? CAT_CLAUSE : '') + '.'
  }
}
