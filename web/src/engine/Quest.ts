import type { GameState } from './GameState'

export interface QuestOptions {
  name: string
  description: string
  /** Shown when the quest completes; defaults to a plain sentence. */
  completion?: string
}

/** One requirement or clue of a checklist quest. */
export interface QuestChecklistItem {
  done: boolean
  /** Engine markup (may name characters, items…). */
  text: string
}

/** A checklist quest's state: a lead-in line and what is done or still open. */
export interface QuestChecklist {
  intro: string
  items: QuestChecklistItem[]
}

/**
 * What a quest's log holds, as data: a journal (the newest entry, earlier
 * entries kept apart) or a checklist.
 */
export type QuestDetails =
  | { kind: 'journal'; latest: string; earlier: string[] }
  | ({ kind: 'checklist' } & QuestChecklist)

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
  /** Journal quests: the entries before the newest (absent in older saves). */
  earlierStages?: string[]
  /** Journal quests: the newest entry (absent in older saves). */
  latestStage?: string
  /** Checklist quests: the lead-in and items (absent in older saves). */
  checklist?: QuestChecklist

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

  /**
   * Set a journal log: the earlier entries and the newest. The prose
   * `description` is rebuilt for text readers, earlier entries dimmed.
   */
  protected setJournal(earlier: string[], latest: string): void {
    this.earlierStages = earlier
    this.latestStage = latest
    this.checklist = undefined
    this.description =
      earlier.map((stage) => `[dim]${stage}[/dim]`).join('') + latest
  }

  /** Set a checklist log, with the prose `description` that shows it as text. */
  protected setChecklist(checklist: QuestChecklist, description: string): void {
    this.checklist = checklist
    this.earlierStages = undefined
    this.latestStage = undefined
    this.description = description
  }

  /**
   * The one line the `hint` command gives for this quest: by default the
   * newest journal entry, or the first open item of a checklist. A quest may
   * override it to say something sharper; null gives the player nothing.
   */
  hint(_gameState: GameState): string | null {
    const details = this.details()
    if (details.kind === 'checklist') {
      return details.items.find((item) => !item.done)?.text ?? null
    }
    return details.latest || this.description || null
  }

  /**
   * The quest log as data, for a UI. Quests that never set a journal or
   * checklist (and older saves) are a journal of the description alone.
   */
  details(): QuestDetails {
    if (this.checklist) return { kind: 'checklist', ...this.checklist }
    const kept = this.earlierStages !== undefined
    const earlier = (this.earlierStages ?? [])
      .map((stage) => stage.trim())
      .filter(Boolean)
    const latest = (kept ? (this.latestStage ?? '') : this.description).trim()
    if (!latest && earlier.length)
      return {
        kind: 'journal',
        latest: earlier[earlier.length - 1],
        earlier: earlier.slice(0, -1),
      }
    return { kind: 'journal', latest, earlier }
  }
}
