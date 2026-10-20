import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const LITERAL = /\[\/?(character_name|dialogue|event)\]/

/** Every non-test TypeScript file under `dir`, recursively. */
function contentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return contentFiles(path)
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : []
  })
}

describe('Act I markup', () => {
  it('is written through the engine helpers, never as hand-spelled tags', () => {
    const offenders = contentFiles(__dirname).filter((file) =>
      LITERAL.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})
