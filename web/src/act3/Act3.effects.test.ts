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

/** Act III answers narrate their effect: no echo of the command is written. */
describe('Act III effects', () => {
  it('writes no grey event line: only the engine keeps those markers', () => {
    const offenders = contentFiles(__dirname).filter((file) =>
      /\bevent\(/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('never opens an answer by repeating the typed command', () => {
    const echo =
      /['"`](You (speak with|say|cast|examine|give|recite|daub|stand still|arrive at|unfold|offer|study|seat|combine|wedge|bind|hammer)\b)/
    const offenders = contentFiles(__dirname).filter((file) =>
      echo.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})
