/**
 * Tests for the image build cache in the CI workflow (rq-rm00): exporting it
 * costs minutes, and its only reader is `publish-image`, so the smoke build
 * exports it only on the runs that publish, and `publish-image` only reads it
 * (rq-a82d).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const WORKFLOW = readFileSync(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)

/** The text of the workflow job called `name`. */
function job(name: string): string {
  const block = WORKFLOW.split(/^ {4}(?=[\w-]+:$)/m).find((text) =>
    text.startsWith(`${name}:\n`),
  )
  if (block === undefined) {
    throw new Error(`expected a job called ${name}`)
  }
  return block
}

/** The value of the one-line key `key` in the job called `name`. */
function value(name: string, key: string): string | undefined {
  return new RegExp(`^ +${key}: (.+)$`, 'm').exec(job(name))?.[1]
}

describe('ci.yml and the image cache', () => {
  it('exports the cache from the smoke build only on the runs that publish', () => {
    const publishes = value('publish-image', 'if')
    expect(publishes).toBeDefined()
    expect(value('container-smoke', 'cache-to')).toBe(
      `\${{ ${publishes} && 'type=gha,mode=max' || '' }}`,
    )
  })

  it('does not export the cache a second time from publish-image', () => {
    expect(value('publish-image', 'cache-to')).toBeUndefined()
  })

  it.each(['container-smoke', 'publish-image'])(
    'reads the cache in %s',
    (name) => {
      expect(value(name, 'cache-from')).toBe('type=gha')
    },
  )

  it('still runs the smoke check against the image the build loads', () => {
    expect(value('container-smoke', 'load')).toBe('true')
    expect(value('container-smoke', 'tags')).toBe('retroquest:smoke')
    expect(job('container-smoke')).toContain(
      'run: python3 deploy/test_container.py retroquest:smoke --revision "$REVISION"\n',
    )
  })
})
