/**
 * The act boundary: only `useBridge` loads the acts, and only through dynamic
 * `import()` calls, so each act stays its own chunk. Nothing else outside the
 * act directories (tests aside) may name an act module.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(__dirname)
const ACT_REFERENCE =
  /(?:from|import\()\s*'(?:@\/|(?:\.\.?\/)+)(?:.*\/)?act\d\b/
const BRIDGE = 'composables/useBridge.ts'

/** The relative paths of every non-test source file outside the act directories. */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return /^act\d$/.test(entry.name) ? [] : sources(path)
    }
    return /\.(ts|vue)$/.test(entry.name) && !entry.name.endsWith('.test.ts')
      ? [relative(SRC, path)]
      : []
  })
}

describe('the act boundary', () => {
  it('lets no module outside the acts import one, except the bridge by dynamic import()', () => {
    const offenders = sources(SRC).filter((file) => {
      const lines = readFileSync(join(SRC, file), 'utf8').split('\n')
      return lines.some(
        (line) =>
          ACT_REFERENCE.test(line) &&
          !(file === BRIDGE && line.trim().startsWith('import(')),
      )
    })
    expect(offenders).toEqual([])
  })
})
