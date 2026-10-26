/**
 * Retiring orphaned narration clips: the pure text edit behind `tts/retire-orphans.ts`.
 * The manifest and the lock are generated files, so they are edited entry by entry as text,
 * which keeps what Audio Studio wrote byte for byte.
 */

/** A clip that was retired: its key and its mp3 file. */
export interface RetiredClip {
  key: string
  file: string | undefined
}

/** The result of retiring: the two files' new text and what was removed. */
export interface Retirement {
  manifest: string
  lock: string
  retired: RetiredClip[]
}

const ENTRY_START = /^ "([^"]+)": \{(.*)$/
const MULTI_LINE_END = /^ \},?$/

/** Splits a generated JSON file into its entries (key, lines) keeping the braces apart. */
function entriesOf(text: string): { key: string; lines: string[] }[] {
  const lines = text.split('\n')
  const entries: { key: string; lines: string[] }[] = []
  for (let i = 0; i < lines.length; i++) {
    const start = ENTRY_START.exec(lines[i] ?? '')
    if (!start) continue
    const first = lines[i] ?? ''
    // A one-line entry (the lock) ends on its own line; a manifest entry at ` },`.
    const oneLine = /\},?$/.test(first) && !MULTI_LINE_END.test(first)
    const body = [first]
    while (!oneLine && !MULTI_LINE_END.test(body[body.length - 1] ?? '')) {
      i++
      body.push(lines[i] ?? '')
    }
    entries.push({ key: start[1] ?? '', lines: body })
  }
  return entries
}

/** Rewrites a generated file keeping only the entries whose key `keep` accepts. */
function filterText(text: string, keep: (key: string) => boolean): string {
  const kept = entriesOf(text).filter((entry) => keep(entry.key))
  const rendered = kept.map((entry, index) => {
    const lines = [...entry.lines]
    const last = lines.length - 1
    const comma = index < kept.length - 1 ? ',' : ''
    lines[last] = (lines[last] ?? '').replace(/,$/, '') + comma
    return lines.join('\n')
  })
  return '{\n' + rendered.map((entry) => entry + '\n').join('') + '}\n'
}

/**
 * Drops every clip of the manifest whose key is not among `scriptKeys`, and its lock entry;
 * lock entries with no clip are left alone.
 * Text that has nothing to retire is returned unchanged.
 */
export function retireOrphans(
  scriptKeys: string[],
  manifest: string,
  lock: string,
): Retirement {
  const live = new Set(scriptKeys)
  const retired: RetiredClip[] = []
  for (const entry of entriesOf(manifest)) {
    if (live.has(entry.key)) continue
    const file = /"file": "([^"]+)"/.exec(entry.lines.join('\n'))?.[1]
    retired.push({ key: entry.key, file })
  }
  if (retired.length === 0) return { manifest, lock, retired }
  const gone = new Set(retired.map((clip) => clip.key))
  const keep = (key: string): boolean => !gone.has(key)
  return {
    manifest: filterText(manifest, keep),
    lock: filterText(lock, keep),
    retired,
  }
}
