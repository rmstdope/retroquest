import { Item, type GameState, type Room } from '@/engine'
import {
  SCENERY_BY_KEY,
  SCENERY_BY_ROOM,
  type SceneryAppearance,
} from './sceneryLines'

/**
 * A thing a room's description names that can be examined but not taken:
 * the altar, the fountain, the workbench. It keeps only its `key`; the words
 * it answers to and the line examine reads come from the table in
 * `sceneryLines.ts`, so a line that follows the story is always current.
 */
export class Scenery extends Item {
  key: string
  aliases: string[]

  constructor(key: string) {
    const def = SCENERY_BY_KEY[key]
    super({ name: def.name, description: '', canBeCarried: false })
    this.key = key
    this.aliases = def.aliases
  }

  /** Answers to its chip label and the other typed words of its table entry. */
  override answersTo(name: string): boolean {
    const wanted = name.toLowerCase()
    return (
      super.answersTo(name) ||
      this.aliases.some((alias) => alias.toLowerCase() === wanted)
    )
  }

  /** The table's line for the story as it stands now. */
  override examine(gameState: GameState): string {
    return SCENERY_BY_KEY[this.key].line(gameState)
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
