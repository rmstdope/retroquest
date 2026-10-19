import { parseQuest } from './parseQuest'

/** A quest that started or moved on, shown in the story (Lantern). */
export interface QuestNews {
  kind: 'new' | 'updated'
  name: string
  main: boolean
  /** Engine markup: the description, or for an update its newest stage. */
  text: string
}

/** Earlier stages of a quest description, which the engine dims. */
const EARLIER_STAGE = /\[dim\][\s\S]*?\[\/dim\]/g
/** A clue list with open clues (Act III): there [dim] marks "not found yet". */
const OPEN_CLUE = /^(?:\[dim\])?○ /m

/**
 * Read an activate/update payload from the engine:
 * "[quest_name]Name (main quest)[/quest_name]\n\nDescription". An update
 * shows its newest stage; checklists and clue lists are shown whole.
 */
export function parseQuestNews(
  kind: QuestNews['kind'],
  payload: string,
): QuestNews {
  const split = payload.indexOf('\n\n')
  const header = split < 0 ? payload : payload.slice(0, split)
  const description = split < 0 ? '' : payload.slice(split + 2)
  const { name, main } = parseQuest({ name: header, description })
  const newest = description.replace(EARLIER_STAGE, '').trim()
  return {
    kind,
    name,
    main,
    text:
      kind === 'updated' && newest && !OPEN_CLUE.test(description)
        ? newest
        : description,
  }
}
