/**
 * Split one turn's raw engine markup into blocks for the Lantern story view.
 *
 * - `[dialogue]…[/dialogue]` becomes a dialogue block (it may span lines). Its
 *   speaker is the last `[character_name]` named in the narration before it in
 *   the same turn (e.g. "You speak with Mira." or "Mira smiles…"); names inside
 *   dialogue never count. No such name → speaker is null.
 * - Outside dialogue, each non-blank line becomes one block:
 *   a line wholly wrapped in `[event]` or `[failure]` → event / failure (a
 *   failure wholly wrapped in `[clue]` is a narrated failure, tags removed);
 *   bulleted (`*`) lines wholly wrapped in `[success]` / `[pending]` → items of
 *   one checklist (consecutive items are grouped); anything else → text.
 * - A tag span that runs over several lines (e.g. an `[event]` of two lines) is
 *   closed at the end of each line and reopened on the next, so every block's
 *   markup is balanced on its own; stray closing tags are dropped.
 *
 * - `[gesture]…[/gesture]` is the player's gesture, which the command line
 *   already shows: it is removed (a line left empty is skipped), so it is
 *   neither shown nor voiced. `[effect]` is plain narration: its tags are
 *   removed and its text is kept as written.
 * - A line holding only a speaker's name (optionally followed by a colon, as
 *   in `Name: quote`) right before that speaker's quote is
 *   dropped (the quote's label shows the name); `[character_name][/character_name]`
 *   marks unsigned writing: the quote has no speaker and no label.
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
  | { kind: 'failure'; markup: string; narrated?: true }
  | { kind: 'dialogue'; speaker: string | null; markup: string }
  | { kind: 'checklist'; items: ChecklistItem[] }

const DIALOGUE_OPEN = '[dialogue]'
const DIALOGUE_CLOSE = '[/dialogue]'
const CHARACTER_NAME = /\[character_name\]([\s\S]*?)\[\/character_name\]/g
const NAME_ONLY = /^\[character_name\]([^[]+)\[\/character_name\]:?$/
const CHECKLIST_BULLET = /^\*\s*/
const GESTURE_SPAN = /\[gesture\][\s\S]*?\[\/gesture\] ?/g
const EFFECT_TAG = /\[\/?effect\]/g
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

/** Span tags around a whole line (e.g. `[success]…[/success]`), not the name's own. */
const LEADING_SPANS = /^(\[(?!character_name\])[a-z_]+\])+/
const TRAILING_SPANS = /(\[\/(?!character_name\])[a-z_]+\])+$/

/**
 * Drop each line that holds only a speaker's name when the quote right after
 * it is that speaker's: the quote's label already shows the name. A name line
 * inside a span (`[success]` around the answer) is still name-only once the
 * span tags around it are set aside.
 */
function dropNameBeforeQuote(blocks: TurnBlock[]): TurnBlock[] {
  return blocks.filter((block, index) => {
    const next = blocks[index + 1]
    if (block.kind !== 'text' || next?.kind !== 'dialogue') return true
    const name = block.markup
      .replace(LEADING_SPANS, '')
      .replace(TRAILING_SPANS, '')
      .match(NAME_ONLY)?.[1]
    return name === undefined || name !== next.speaker
  })
}

/** Split one turn's raw markup into story-view blocks (see the file comment). */
export function parseTurn(raw: string): TurnBlock[] {
  const blocks: TurnBlock[] = []
  const turn = raw.replace(GESTURE_SPAN, '').replace(EFFECT_TAG, '')
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
    for (const match of text.matchAll(CHARACTER_NAME))
      speaker = match[1] || null
    // A line that is only tags (e.g. a `[/success]` closing a span after a
    // dialogue) has nothing to show.
    if (!text.replace(ANY_TAG, '').trim()) return

    const event = wholeLine(text, 'event')
    const failure = wholeLine(text, 'failure')
    const success = wholeLine(text, 'success')
    const pending = wholeLine(text, 'pending')
    if (event !== null) blocks.push({ kind: 'event', markup: event })
    else if (failure !== null) {
      const clue = wholeLine(failure, 'clue')
      blocks.push(
        clue === null
          ? { kind: 'failure', markup: failure }
          : { kind: 'failure', markup: clue, narrated: true },
      )
    } else if (CHECKLIST_BULLET.test(success ?? pending ?? '')) {
      addChecklistItem({
        markup: (success ?? pending ?? '').replace(CHECKLIST_BULLET, ''),
        done: success !== null,
      })
    } else blocks.push({ kind: 'text', markup: text })
  }

  function addNarration(chunk: string): void {
    chunk.split('\n').forEach(addLine)
  }

  let rest = turn
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
  return dropNameBeforeQuote(blocks)
}
