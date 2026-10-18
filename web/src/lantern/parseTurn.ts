/**
 * Split one turn's raw engine markup into blocks for the Lantern story view.
 *
 * - `[dialogue]…[/dialogue]` becomes a dialogue block (it may span lines). Its
 *   speaker is the last `[character_name]` named in the narration before it in
 *   the same turn (e.g. "You speak with Mira." or "Mira smiles…"); names inside
 *   dialogue never count. No such name → speaker is null.
 * - Outside dialogue, each non-blank line becomes one block:
 *   a line wholly wrapped in `[event]` or `[failure]` → event / failure;
 *   lines wholly wrapped in `[success]` / `[pending]` → items of one checklist
 *   (consecutive items are grouped); anything else → text.
 *
 * Blocks keep their inner markup (inline tags like `[item_name]`); rendering
 * to HTML is the view's job.
 */

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

/** Inner markup if `line` is wholly one `[tag]…[/tag]` span, else null. */
function wholeLine(line: string, tag: string): string | null {
  const open = `[${tag}]`
  const close = `[/${tag}]`
  if (!line.startsWith(open) || !line.endsWith(close)) return null
  const inner = line.slice(open.length, line.length - close.length)
  return inner.includes(open) || inner.includes(close) ? null : inner
}

export function parseTurn(raw: string): TurnBlock[] {
  const blocks: TurnBlock[] = []
  let speaker: string | null = null

  function addChecklistItem(item: ChecklistItem): void {
    const last = blocks[blocks.length - 1]
    if (last?.kind === 'checklist') last.items.push(item)
    else blocks.push({ kind: 'checklist', items: [item] })
  }

  function addLine(line: string): void {
    const text = line.trim()
    if (!text) return
    for (const match of text.matchAll(CHARACTER_NAME)) speaker = match[1]

    const event = wholeLine(text, 'event')
    const failure = wholeLine(text, 'failure')
    const success = wholeLine(text, 'success')
    const pending = wholeLine(text, 'pending')
    if (event !== null) blocks.push({ kind: 'event', markup: event })
    else if (failure !== null) blocks.push({ kind: 'failure', markup: failure })
    else if (success !== null || pending !== null) {
      const inner = (success ?? pending) as string
      addChecklistItem({
        markup: inner.trim().replace(CHECKLIST_BULLET, ''),
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
    if (body) blocks.push({ kind: 'dialogue', speaker, markup: body })
    if (close < 0) break
    rest = rest.slice(close + DIALOGUE_CLOSE.length)
  }
  return blocks
}
