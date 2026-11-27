/**
 * Tests for what keeps a CI check from going red without a real failure: the
 * e2e jobs run in the Playwright image, which already holds the browser and its
 * system packages, so nothing is downloaded from a mirror (rq-2ram), and a test
 * tagged `@quarantine` runs in a job that cannot go red and names the bead that
 * will bring it back (rq-vjbs).
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'

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

/** The step of a job that holds `text`. */
function step(name: string, text: string): string {
  const found = job(name)
    .split(/^ {12}- /m)
    .find((block) => block.includes(text))
  if (found === undefined) {
    throw new Error(`expected a step of ${name} holding ${text}`)
  }
  return found
}

const LOCK = JSON.parse(
  readFileSync(new URL('./package-lock.json', import.meta.url), 'utf8'),
) as { packages: Record<string, { version: string }> }

const VERSION = LOCK.packages['node_modules/@playwright/test']?.version

/** The image holding the browser of the `@playwright/test` version the lock file pins. */
const IMAGE = `mcr.microsoft.com/playwright:v${VERSION}-noble`

/** What to do when the workflow and the lock file disagree. */
const OUT_OF_STEP = `set every Playwright image in .github/workflows/ci.yml to ${IMAGE}`

describe('ci.yml and the Playwright image', () => {
  it('runs the e2e shards in it, and in no container when the checks are skipped', () => {
    expect(job('web-e2e'), OUT_OF_STEP).toContain(
      '        container:\n' +
        `            image: \${{ needs.changes.outputs.run != 'false' && '${IMAGE}' || '' }}\n` +
        '            options: --user 1001 --init --ipc=host\n',
    )
  })

  it('runs the quarantined tests in it', () => {
    expect(job('web-e2e-quarantine'), OUT_OF_STEP).toContain(
      '        container:\n' +
        `            image: ${IMAGE}\n` +
        '            options: --user 1001 --init --ipc=host\n',
    )
  })

  it('names no other version of it', () => {
    const named = WORKFLOW.match(/mcr\.microsoft\.com\/playwright:[\w.-]+/g)
    expect(new Set(named), OUT_OF_STEP).toEqual(new Set([IMAGE]))
  })

  it.each(['web-e2e', 'web-e2e-quarantine'])(
    'installs no browser in %s',
    (name) => {
      expect(job(name)).not.toMatch(/playwright[ -]install|install-playwright/)
    },
  )
})

describe('ci.yml and the flakes', () => {
  it('leaves quarantined tests out of the e2e shards', () => {
    expect(job('web-e2e')).toContain(
      'run: npx playwright test --shard=${{ matrix.shard }} --grep-invert @quarantine\n',
    )
  })

  it('runs the quarantined tests in a job of their own', () => {
    expect(job('web-e2e-quarantine')).toContain(
      'run: npx playwright test --grep @quarantine --pass-with-no-tests --trace retain-on-failure\n',
    )
  })

  it('uploads the trace of every failed quarantined attempt, the first one too (rq-4zhj)', () => {
    const upload = step('web-e2e-quarantine', 'uses: actions/upload-artifact')
    expect(upload).toContain('if: ${{ !cancelled() }}\n')
    expect(upload).toContain('path: web/test-results/\n')
  })

  it('never turns the quarantine check red on a failed quarantined test', () => {
    expect(step('web-e2e-quarantine', '--grep @quarantine')).toContain(
      'continue-on-error: true\n',
    )
  })

  it('does not hold the image back for a quarantined test', () => {
    expect(job('publish-image')).not.toContain('web-e2e-quarantine')
  })
})

const E2E = new URL('./e2e/', import.meta.url)

/** Every `@quarantine` tag in the specs, with the text that follows it up to the test's body. */
function quarantined(): { file: string; declaration: string }[] {
  return readdirSync(E2E)
    .filter((file) => file.endsWith('.spec.ts'))
    .flatMap((file) =>
      readFileSync(new URL(file, E2E), 'utf8')
        .split("tag: '@quarantine'")
        .slice(1)
        .map((rest) => ({ file, declaration: rest.split('async (')[0] ?? '' })),
    )
}

describe('quarantined specs', () => {
  it('name the bead that brings each of them back', () => {
    for (const { file, declaration } of quarantined()) {
      expect(declaration, file).toMatch(
        /annotation: \{ type: 'bead', description: 'rq-[\w.]+' \}/,
      )
    }
  })

  it('are tagged only in the form the check above reads', () => {
    for (const file of readdirSync(E2E).filter((f) => f.endsWith('.ts'))) {
      const text = readFileSync(new URL(file, E2E), 'utf8')
      const mentions = text.split('@quarantine').length
      const tags = text.split("tag: '@quarantine'").length
      expect(mentions, file).toBe(tags)
    }
  })
})
