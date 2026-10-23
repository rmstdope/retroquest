import type { QuestReport } from '@/types/bridge'

/** A quest that started, moved on or was completed, shown in the story (Lantern). */
export interface QuestNews {
  kind: 'new' | 'updated' | 'completed'
  name: string
  main: boolean
  /**
   * Engine markup: the description, for an update its newest stage, for a
   * completion the completion text.
   */
  text: string
  /** Quests done in the act once this one completed (completions only). */
  progress?: { completed: number; total: number }
  /** The new-quest chime is owed: it rings when the card shows (`ringQuestChime`). */
  chime?: true
}

/** The story record of a quest event from the engine. */
export function toQuestNews(
  kind: QuestNews['kind'],
  event: QuestReport,
): QuestNews {
  return { kind, name: event.name, main: event.main, text: event.text }
}

/** The heading of a new quest's card: "New main quest" or "New side quest". */
export function newQuestKicker(main: boolean): string {
  return `New ${main ? 'main' : 'side'} quest`
}

/** The heading of a completed quest: "Main quest complete" or "Side quest complete". */
export function questCompleteKicker(main: boolean): string {
  return `${main ? 'Main' : 'Side'} quest complete`
}
