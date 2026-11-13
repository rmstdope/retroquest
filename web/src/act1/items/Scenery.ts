import { Item, type GameState, type Room } from '@/engine'
import {
  SCENERY_BY_KEY,
  SCENERY_BY_ROOM,
  type SceneryAppearance,
} from './sceneryLines'

/**
 * A thing a room's description names that can be examined but not taken:
 * the altar, the fountain, the workbench. A save keeps its `key` and its chip
 * label; the other typed words and the line examine reads come from the table
 * in `sceneryLines.ts` (and `refreshSavedText` refreshes the label), so a line that follows the story is always current.
 */
export class Scenery extends Item {
  key: string

  constructor(key: string) {
    const def = SCENERY_BY_KEY[key]
    super({ name: def.name, description: '', canBeCarried: false })
    this.key = key
  }

  /** Answers to its chip label and the other typed words of its table entry. */
  override otherNames(): string[] {
    return SCENERY_BY_KEY[this.key].aliases
  }

  /** Give a saved chip the table's current label. */
  override refreshSavedText(_gameState: GameState): void {
    this.name = SCENERY_BY_KEY[this.key].name
    this.shortName = this.name
  }

  /** The table's line for the story as it stands now. */
  override examine(gameState: GameState): string {
    return SCENERY_BY_KEY[this.key].line(gameState)
  }

  /** The table's answer for a near miss used with this thing, if it has one. */
  override answerUseFrom(gameState: GameState, item: Item): string {
    return SCENERY_BY_KEY[this.key].useFrom?.(gameState, item) ?? ''
  }

  /** The table's answer when the thing is used on its own, if it has one. */
  override use(gameState: GameState): string {
    return SCENERY_BY_KEY[this.key].use?.(gameState) ?? super.use(gameState)
  }

  /** The things of `roomKey` that show from the first visit, or from `appears`. */
  static forRoom(roomKey: string, appears?: SceneryAppearance): Scenery[] {
    return (SCENERY_BY_ROOM[roomKey] ?? [])
      .filter((def) => def.appears === appears)
      .map((def) => new Scenery(def.key))
  }

  /**
   * Add to `room` the things of `roomKey` it lacks, for a first visit
   * (`appears` undefined) or for those that appear later; idempotent, so a
   * load can call it on a save that predates them.
   */
  static ensure(
    room: Room,
    roomKey: string,
    appears?: SceneryAppearance,
  ): void {
    for (const scenery of Scenery.forRoom(roomKey, appears)) {
      if (
        !room.items.some(
          (item) => item instanceof Scenery && item.key === scenery.key,
        )
      ) {
        room.items.push(scenery)
      }
    }
  }
}
