import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Every non-test TypeScript file under `dir`, recursively. */
function contentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return contentFiles(path)
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : []
  })
}

/** The only plain `[failure]` boxes left in Act IV: the two bare "no"s. */
const SILENT_REFUSALS = [
  'That magic is gone from you now.',
  'You are home. There is nowhere else you need to go.',
]

describe('Act IV narration', () => {
  it('writes no grey event line: effects are bare and the markers come from the engine', () => {
    const offenders = contentFiles(__dirname).filter((file) =>
      /\bevent\(/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('never opens a string by repeating the typed command unless marked as an effect', () => {
    const echo =
      /(?<!effect\(\s*)['"`]You (speak with|say|cast|examine|give|recite|daub|stand still|arrive at|unfold|offer|study|seat|combine|wedge|bind|hammer)\b/
    const offenders = contentFiles(__dirname).filter((file) =>
      echo.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('keeps only the two bare refusals as plain, silent failure boxes', () => {
    const plain = contentFiles(__dirname).flatMap((file) =>
      [
        ...readFileSync(file, 'utf8').matchAll(
          /\[failure\]([^[]+)\[\/failure\]/g,
        ),
      ].map((match) => match[1]),
    )
    expect(plain.sort()).toEqual([...SILENT_REFUSALS].sort())
  })
})
