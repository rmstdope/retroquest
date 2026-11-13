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
 * One step of a quest declared with `stages()`: the test that reaches it, the
 * log entry it adds and what to do while it is the next one still ahead.
 */
export interface QuestStage {
  /** Names the stage in `flagState`, which keeps the order they were reached. */
  key: string
  /** True once the player has reached the stage. */
  reached: (gameState: GameState) => boolean
  /**
   * The journal entry the stage adds (it carries its own leading line break).
   * A function gets the keys of the stages reached so far, in reached order.
   */
  log: string | ((reachedKeys: readonly string[]) => string)
  /**
   * What to do next while this is the first stage not yet reached. Null (or
   * none) leaves the hint to the stages after it, then to the newest entry.
   */
  hint?: string | ((gameState: GameState) => string | null)
  /** Stages of a lower chapter always come first in the log (default 0). */
  chapter?: number
}

/**
 * A stage reached when a story flag is raised. `lead` goes before the log
 * entry (the line breaks that set it off from the entry before).
 */
export function flagStage(
  flag: string,
  log: QuestStage['log'],
  options: Pick<QuestStage, 'hint' | 'chapter'> & { lead?: string } = {},
): QuestStage {
  const { lead = '', ...rest } = options
  return {
    key: flag,
    reached: (gameState) => gameState.getStoryFlag(flag),
    log:
      typeof log === 'string'
        ? `${lead}${log}`
        : (keys) => `${lead}${log(keys)}`,
    ...rest,
  }
}

/**
 * What a quest's log holds, as data: a journal (the newest entry, earlier
 * entries kept apart) or a checklist. A finished checklist quest also carries
 * its `outcome`, the completion text, beside the list it kept.
 */
export type QuestDetails =
  | { kind: 'journal'; latest: string; earlier: string[] }
  | ({ kind: 'checklist'; outcome?: string } & QuestChecklist)

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
  /**
   * Staged quests: the keys of the stages reached, in the order the player
   * reached them (a record keeps its insertion order, in saves too).
   */
  flagState: Record<string, boolean> = {}

  constructor({ name, description, completion }: QuestOptions) {
    this.name = name
    this.description = description
    this.completion = completion ?? `You have completed the quest '${name}'.`
  }

  /**
   * Give the static text a save keeps (a description, a name) the current
   * wording after a load. The engine calls it on every saved room, room item,
   * room character, carried item, known spell and quest, after the act's
   * `afterLoad`; it must be idempotent. Does nothing by default.
   */
  refreshSavedText(_gameState: GameState): void {}

  checkTrigger(_gameState: GameState): boolean {
    return false
  }

  /**
   * The story flag raised when this quest completes, or null for none. A
   * method, not a field, so saves made before a quest declared it still work.
   */
  completedFlag(): string | null {
    return null
  }

  /**
   * True once the quest has been completed, or its declared completed flag is
   * already raised (a save from before the engine raised it). A quest with its
   * own condition overrides this; the engine then completes it.
   */
  checkCompletion(gameState: GameState): boolean {
    const flag = this.completedFlag()
    return this.completed || (flag !== null && gameState.getStoryFlag(flag))
  }

  /**
   * Mark the quest completed, raise its completed flag and return its
   * completion text. The one place a quest's completed flag is raised.
   */
  complete(gameState: GameState): string {
    this.completed = true
    const flag = this.completedFlag()
    if (flag !== null) gameState.setStoryFlag(flag, true)
    return this.completion
  }

  /** True when the stage's test holds now or the log has already noted it. */
  private isReached(stage: QuestStage, gameState: GameState): boolean {
    return this.flagState[stage.key] === true || stage.reached(gameState)
  }

  /**
   * A staged quest's steps, in story order; none by default. With stages the
   * engine builds the journal (`checkUpdate`) and the hint from them.
   */
  protected stages(): QuestStage[] {
    return []
  }

  /**
   * A staged quest's first journal entry, before any stage is reached. A
   * staged quest overrides it with a constant: the description it falls back
   * to is rebuilt from the journal.
   */
  protected opening(): string {
    return this.description
  }

  /**
   * What `hint` says once every stage is reached; null reads the newest
   * journal entry.
   */
  protected closingHint(_gameState: GameState): string | null {
    return null
  }

  /**
   * True when the quest log should show the quest again (its description
   * changed). A staged quest rebuilds its journal: the opening, then each
   * reached stage, lower chapters first and within a chapter in the order
   * first reached, so the newest is usually the latest. True only when a
   * stage was reached for the first time and the newest entry changed: a
   * stage folded in among the earlier ones is not news.
   */
  checkUpdate(gameState: GameState): boolean {
    const stages = this.stages()
    if (stages.length === 0) return false
    const shown = stages.filter((stage) => this.isReached(stage, gameState))
    let fresh = false
    for (const { key } of shown) {
      if (this.flagState[key]) continue
      this.flagState[key] = true
      fresh = true
    }
    const noticed = Object.keys(this.flagState)
    shown.sort(
      (a, b) =>
        (a.chapter ?? 0) - (b.chapter ?? 0) ||
        noticed.indexOf(a.key) - noticed.indexOf(b.key),
    )
    const entries = [
      this.opening(),
      ...shown.map(({ log }) => (typeof log === 'string' ? log : log(noticed))),
    ]
    const latestBefore = this.latestStage
    this.setJournal(entries.slice(0, -1), entries[entries.length - 1])
    return fresh && this.latestStage !== latestBefore
  }

  /**
   * Bring an older save's order in line with the stages: a stage already
   * reached but never noted (declared after the save was made) is slotted in
   * at its place in the story, before the first later stage already noted.
   */
  protected slotUnnotedStages(gameState: GameState): void {
    const order = this.stages().map(({ key }) => key)
    const noted = Object.keys(this.flagState)
    for (const stage of this.stages()) {
      if (noted.includes(stage.key) || !stage.reached(gameState)) continue
      const later = order.slice(order.indexOf(stage.key) + 1)
      const at = noted.findIndex((key) => later.includes(key))
      noted.splice(at < 0 ? noted.length : at, 0, stage.key)
    }
    this.flagState = Object.fromEntries(noted.map((key) => [key, true]))
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
   * The one line the `hint` command gives for this quest: for a staged
   * quest the hint of the first stage not yet reached that has one (the
   * closing hint once all are); otherwise the newest journal entry, or a
   * checklist's lead-in with its first open item. A quest may override it to
   * say something sharper; null gives the player nothing.
   */
  hint(gameState: GameState): string | null {
    const stages = this.stages()
    if (stages.length > 0) {
      for (const stage of stages) {
        if (this.isReached(stage, gameState) || stage.hint === undefined)
          continue
        const text =
          typeof stage.hint === 'string' ? stage.hint : stage.hint(gameState)
        if (text !== null) return text
      }
      if (stages.every((stage) => this.isReached(stage, gameState))) {
        const closing = this.closingHint(gameState)
        if (closing !== null) return closing
      }
    }
    const details = this.details()
    if (details.kind === 'checklist') {
      const open = details.items.find((item) => !item.done)
      return open ? `${details.intro} ${open.text}`.trim() : null
    }
    return details.latest || null
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
