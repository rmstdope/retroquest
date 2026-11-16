// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** The folder of the Lantern's components, which watch sizes only through `useSizeWatch`. */
const LANTERN = join(__dirname, '..', 'components', 'lantern')

describe('size observers on the Lantern stage', () => {
  it('are all made by useSizeWatch, which alone decides when their work may run', () => {
    const own = readdirSync(LANTERN)
      .filter((name) => name.endsWith('.vue'))
      .filter((name) =>
        readFileSync(join(LANTERN, name), 'utf8').includes(
          'new ResizeObserver',
        ),
      )
    expect(own).toEqual([])
  })
})
