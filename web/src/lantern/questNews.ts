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
}

/** The story record of a quest event from the engine. */
export function toQuestNews(
  kind: QuestNews['kind'],
  event: QuestReport,
): QuestNews {
  return { kind, name: event.name, main: event.main, text: event.text }
}
