import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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
  it('no item, room or character assigns a description after construction', () => {
    const offenders: string[] = []
    for (const act of ['act1', 'act2', 'act3', 'act4']) {
      for (const dir of ['items', 'rooms', 'characters']) {
        const root = join(__dirname, act, dir)
        if (!existsSync(root)) continue
        const files = sourceFiles(root)
        for (const file of files) {
          const text = readFileSync(file, 'utf8')
          if (/\.description\s*=[^=]/.test(text)) offenders.push(file)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
