import type { GameState } from './GameState'

export interface QuestOptions {
  name: string
  description: string
  /** Shown when the quest completes; defaults to a plain sentence. */
  completion?: string
}

/**
 * Base class for all quests. A quest activates when `checkTrigger` becomes
 * true, reports log changes through `checkUpdate` and ends when
 * `checkCompletion` becomes true.
 */
export class Quest {
  name: string
  description: string
  completion: string
  completed = false

  constructor({ name, description, completion }: QuestOptions) {
    this.name = name
    this.description = description
    this.completion = completion ?? `You have completed the quest '${name}'.`
  }

  checkTrigger(_gameState: GameState): boolean {
    return false
  }

  checkCompletion(_gameState: GameState): boolean {
    return this.completed
  }

  /** Mark the quest completed and return its completion text. */
  complete(_gameState: GameState): string {
    this.completed = true
    return this.completion
  }

  /** True when the quest log should show the quest again (its description changed). */
  checkUpdate(_gameState: GameState): boolean {
    return false
  }

  isMain(): boolean {
    return false
  }
}
