import type { SerializableClass } from './ClassRegistry'
import type { GameState } from './GameState'
import type { Quest } from './Quest'
import type { Room } from './Room'

export interface ActOptions {
  name: string
  /** Room key → room. The first room is where the act starts. */
  rooms: Record<string, Room>
  quests: Quest[]
  /** File under the audio music directory, or '' for silence. */
  musicFile: string
  /** Credits shown for the music. */
  musicInfo: string
  /**
   * The act's content classes by name, so saves can name them as
   * `<act name>.<class name>` (`{ Bread, Mira, EliorsCottage, ... }`). Content
   * classes only: the engine registers its own. Defaults to none.
   */
  classes?: Record<string, SerializableClass>
  /**
   * The commands that play the act from a new game to its end, used by the
   * `cheat act N` command and by the act's integration test. Defaults to none.
   */
  goldenPath?: string[]
}

/** An act: its rooms, quests, music and act-level hooks. */
export class Act {
  name: string
  rooms: Record<string, Room>
  quests: Quest[]
  musicFile: string
  musicInfo: string
  classes: Record<string, SerializableClass>
  /** The commands that play the act through; empty until the act has a path. */
  goldenPath: string[]

  constructor({
    name,
    rooms,
    quests,
    musicFile,
    musicInfo,
    classes,
    goldenPath,
  }: ActOptions) {
    this.name = name
    this.rooms = rooms
    this.quests = quests
    this.musicFile = musicFile
    this.musicInfo = musicInfo
    this.classes = classes ?? {}
    this.goldenPath = goldenPath ?? []
  }

  getActIntro(): string {
    return ''
  }

  /**
   * A line that opens the act-complete page before the words every act
   * shares, to leave the player on a hook. Empty for an act without one. The
   * state is the finished act's, so the hook can follow the player's choices.
   */
  getCompletionHook(_gameState: GameState): string {
    return ''
  }

  /**
   * The failure for a spell the player does not know, or null for the
   * engine's plain "You don't know any spell called ...". Override when the
   * story has taken spells away.
   */
  unknownSpell(_gameState: GameState, _spellName: string): string | null {
    return null
  }

  /** Act-specific set-up of a fresh state (starting items, spells…). */
  setupGameState(_gameState: GameState): void {}

  /**
   * The names of this act's story flags whose values travel into every later
   * act's fresh state (acts share no classes, so a later act reads the same
   * string). Virtues always travel; everything else is dropped. Empty by
   * default.
   */
  carriedFlags(): string[] {
    return []
  }

  /**
   * Bring a state loaded from a save up to date, e.g. drop data that older
   * saves still hold. Runs on every load, so it must be idempotent.
   */
  afterLoad(_gameState: GameState): void {}

  /**
   * Called after the player has walked from one room to another, before the
   * new room's `onEnter` runs. Override to let characters follow the player.
   */
  onRoomChanged(_gameState: GameState, _from: Room, _to: Room): void {}

  isCompleted(_gameState: GameState): boolean {
    return false
  }
}
