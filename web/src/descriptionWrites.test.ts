import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Every non-test TypeScript file under `dir`, recursively. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : []
  })
}

/** Where the text a thing or a room shows is computed, and nowhere else. */
describe('description writes', () => {
  it('no content file assigns a description after construction, except spells and quests', () => {
    const offenders: string[] = []
    for (const act of ['act1', 'act2', 'act3', 'act4']) {
      for (const file of sourceFiles(join(__dirname, act))) {
        if (/[/\\](spells|quests)[/\\]/.test(file)) continue
        const text = readFileSync(file, 'utf8')
        if (
          /\.description\s*=[^=]/.test(text) ||
          /\[['"]description['"]\]\s*=[^=]/.test(text) ||
          /Object\.assign\([^)]*description/.test(text)
        )
          offenders.push(file)
      }
    }
    expect(offenders).toEqual([])
  })
})
