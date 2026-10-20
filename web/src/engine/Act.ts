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

  /** Act-specific set-up of a fresh state (starting items, spells…). */
  setupGameState(_gameState: GameState): void {}

  isCompleted(_gameState: GameState): boolean {
    return false
  }
}
