import type { NamedItem } from '@/types/bridge'

/**
 * A quest as the journal shows it. The bridge delivers names such as
 * "[quest_name]Shadows Over Willowbrook (main)[/quest_name]".
 */
export interface QuestEntry {
  name: string
  main: boolean
  /** Engine markup (may contain [dim] earlier stages and checklists). */
  description: string
}

const MARKUP_TAG = /\[\/?[a-z_]+\]/g
const TYPE_SUFFIX = /\s*\((main|side)(?: quest)?\)\s*$/

export function parseQuest(raw: NamedItem): QuestEntry {
  const text = raw.name.replace(MARKUP_TAG, '').trim()
  const match = TYPE_SUFFIX.exec(text)
  return {
    name: match ? text.slice(0, match.index) : text,
    main: match?.[1] === 'main',
    description: raw.description,
  }
}
