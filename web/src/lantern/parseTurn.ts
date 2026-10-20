/**
 * Split one turn's raw engine markup into blocks for the Lantern story view.
 *
 * - `[dialogue]…[/dialogue]` becomes a dialogue block (it may span lines). Its
 *   speaker is the last `[character_name]` named in the narration before it in
 *   the same turn (e.g. "You speak with Mira." or "Mira smiles…"); names inside
 *   dialogue never count. No such name → speaker is null.
 * - Outside dialogue, each non-blank line becomes one block:
 *   a line wholly wrapped in `[event]` or `[failure]` → event / failure;
 *   bulleted (`*`) lines wholly wrapped in `[success]` / `[pending]` → items of
 *   one checklist (consecutive items are grouped); anything else → text.
 * - A tag span that runs over several lines (e.g. an `[event]` of two lines) is
 *   closed at the end of each line and reopened on the next, so every block's
 *   markup is balanced on its own; stray closing tags are dropped.
 *
 * Blocks keep their inner markup (inline tags like `[item_name]`); rendering
 * to HTML is the view's job.
 */

import { MARKUP_TAGS } from '@/engine/markup'

export interface ChecklistItem {
  markup: string
  done: boolean
}

export type TurnBlock =
  | { kind: 'text'; markup: string }
  | { kind: 'event'; markup: string }
  | { kind: 'failure'; markup: string }
  | { kind: 'dialogue'; speaker: string | null; markup: string }
  | { kind: 'checklist'; items: ChecklistItem[] }

const DIALOGUE_OPEN = '[dialogue]'
const DIALOGUE_CLOSE = '[/dialogue]'
const CHARACTER_NAME = /\[character_name\]([\s\S]*?)\[\/character_name\]/g
const CHECKLIST_BULLET = /^\*\s*/
const SPAN_TAG = new RegExp(
  `\\[(/?)(${MARKUP_TAGS.filter((tag) => tag !== 'dialogue').join('|')})\\]`,
  'g',
)

/**
 * Make `markup` self-contained: reopen the tags in `open` (left open by earlier
 * lines), drop closing tags with no opener and close what is still open. `open`
 * is updated to the tags left open at the end of `markup`.
 */
function balance(markup: string, open: string[]): string {
  const reopen = open.map((tag) => `[${tag}]`).join('')
  const body = markup.replace(SPAN_TAG, (match, slash: string, tag: string) => {
    if (!slash) {
      open.push(tag)
      return match
    }
    const index = open.lastIndexOf(tag)
    if (index < 0) return ''
    open.splice(index, 1)
    return match
  })
  const close = [...open]
    .reverse()
    .map((tag) => `[/${tag}]`)
    .join('')
  return reopen + body + close
}

/** Any opening or closing markup tag (bracketed words in prose don't count). */
const ANY_TAG = new RegExp(`\\[/?(${MARKUP_TAGS.join('|')})\\]`, 'g')

/** Inner markup if `line` is wholly one `[tag]…[/tag]` span, else null. */
function wholeLine(line: string, tag: string): string | null {
  const open = `[${tag}]`
  const close = `[/${tag}]`
  if (!line.startsWith(open) || !line.endsWith(close)) return null
  const inner = line.slice(open.length, line.length - close.length)
  return inner.includes(open) || inner.includes(close) ? null : inner.trim()
}

export function parseTurn(raw: string): TurnBlock[] {
  const blocks: TurnBlock[] = []
  let speaker: string | null = null
  const openTags: string[] = []

  function addChecklistItem(item: ChecklistItem): void {
    const last = blocks[blocks.length - 1]
    if (last?.kind === 'checklist') last.items.push(item)
    else blocks.push({ kind: 'checklist', items: [item] })
  }

  function addLine(line: string): void {
    if (!line.trim()) return
    const text = balance(line.trim(), openTags)
    // A line that is only tags (e.g. a `[/success]` closing a span after a
    // dialogue) has nothing to show.
    if (!text.replace(ANY_TAG, '').trim()) return
    for (const match of text.matchAll(CHARACTER_NAME)) speaker = match[1]

    const event = wholeLine(text, 'event')
    const failure = wholeLine(text, 'failure')
    const success = wholeLine(text, 'success')
    const pending = wholeLine(text, 'pending')
    if (event !== null) blocks.push({ kind: 'event', markup: event })
    else if (failure !== null) blocks.push({ kind: 'failure', markup: failure })
    else if (CHECKLIST_BULLET.test(success ?? pending ?? '')) {
      addChecklistItem({
        markup: (success ?? pending ?? '').replace(CHECKLIST_BULLET, ''),
        done: success !== null,
      })
    } else blocks.push({ kind: 'text', markup: text })
  }

  function addNarration(chunk: string): void {
    chunk.split('\n').forEach(addLine)
  }

  let rest = raw
  for (;;) {
    const open = rest.indexOf(DIALOGUE_OPEN)
    if (open < 0) {
      addNarration(rest)
      break
    }
    addNarration(rest.slice(0, open))
    const bodyStart = open + DIALOGUE_OPEN.length
    const close = rest.indexOf(DIALOGUE_CLOSE, bodyStart)
    const body = (
      close < 0 ? rest.slice(bodyStart) : rest.slice(bodyStart, close)
    ).trim()
    if (body)
      blocks.push({ kind: 'dialogue', speaker, markup: balance(body, []) })
    if (close < 0) break
    rest = rest.slice(close + DIALOGUE_CLOSE.length)
  }
  return blocks
}
