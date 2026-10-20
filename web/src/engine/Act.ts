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
}

/** An act: its rooms, quests, music and act-level hooks. */
export class Act {
  name: string
  rooms: Record<string, Room>
  quests: Quest[]
  musicFile: string
  musicInfo: string

  constructor({ name, rooms, quests, musicFile, musicInfo }: ActOptions) {
    this.name = name
    this.rooms = rooms
    this.quests = quests
    this.musicFile = musicFile
    this.musicInfo = musicInfo
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
