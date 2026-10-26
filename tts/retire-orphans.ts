/**
 * Retires the clips whose line left the script: for each act, drops the entries of
 * `web/public/audio/narration/act<N>/manifest.json` and `tts/act<N>/narration.lock.json`
 * whose key is not in `tts/act<N>/script.json`, and deletes their mp3 files. Run it after
 * `extract-act.ts` when a wording change has left a clip behind (the "has no clip for a
 * line that left the script" test in `narrationCasts.test.ts` is red until then).
 * The files are edited as text, entry by entry, so what Audio Studio wrote is kept byte
 * for byte. Run from `web/`:
 * `npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/retire-orphans.ts [act...]`
 * (no act: all four).
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

/** Retires the orphans of one act on disk and says what went. */
function retireAct(act: number): void {
  const tts = new URL(`act${act}/`, import.meta.url)
  const audio = new URL(
    `../web/public/audio/narration/act${act}/`,
    import.meta.url,
  )
  const script = JSON.parse(
    readFileSync(new URL('script.json', tts), 'utf8'),
  ) as {
    key: string
  }[]
  const manifestFile = new URL('manifest.json', audio)
  const lockFile = new URL('narration.lock.json', tts)
  const result = retireOrphans(
    script.map((line) => line.key),
    readFileSync(manifestFile, 'utf8'),
    readFileSync(lockFile, 'utf8'),
  )
  if (result.retired.length === 0) return
  writeFileSync(manifestFile, result.manifest)
  writeFileSync(lockFile, result.lock)
  for (const clip of result.retired) {
    if (!clip.file) continue
    const mp3 = new URL(clip.file, audio)
    if (existsSync(mp3)) rmSync(mp3)
  }
  console.log(`Act ${act}: retired ${result.retired.length} clip(s)`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const named = process.argv.slice(2).map(Number)
  if (named.some((act) => ![1, 2, 3, 4].includes(act))) {
    console.error('Usage: retire-orphans.ts [act 1-4 ...]')
    process.exit(1)
  }
  for (const act of named.length ? named : [1, 2, 3, 4]) retireAct(act)
  console.log(`Done (${fileURLToPath(import.meta.url)})`)
}
