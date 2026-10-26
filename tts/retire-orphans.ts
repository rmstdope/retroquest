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
import { retireOrphans } from '../web/src/lantern/retireOrphans'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
