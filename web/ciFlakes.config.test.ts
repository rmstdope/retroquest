/**
 * Tests for what keeps a CI check from going red without a real failure
 * (rq-vjbs): the retried browser install, and the quarantine lane, where a
 * test tagged `@quarantine` runs in a job that cannot go red and names the
 * bead that will bring it back.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(
  new URL('../.github/scripts/install-playwright.sh', import.meta.url),
)

describe('install-playwright.sh', () => {
  let dir: string

  /** Runs the script with a stand-in `npx` that fails its first `failures` calls with status 100. */
  function install(failures: number): {
    status: number | null
    calls: string[]
  } {
    const log = join(dir, 'calls')
    writeFileSync(log, '')
    const npx = join(dir, 'npx')
    writeFileSync(
      npx,
      '#!/usr/bin/env bash\n' +
        `echo "$*" >> "${log}"\n` +
        `[[ $(wc -l < "${log}") -gt ${failures} ]] || exit 100\n`,
    )
    chmodSync(npx, 0o755)
    const { status } = spawnSync('bash', [SCRIPT], {
      env: {
        ...process.env,
        PATH: `${dir}${delimiter}${process.env.PATH}`,
        RETRY_DELAY_S: '0',
      },
    })
    return { status, calls: readFileSync(log, 'utf8').split('\n').slice(0, -1) }
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'install-playwright-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  const COMMAND = 'playwright install --with-deps chromium'

  it('installs once when the first attempt works', () => {
    expect(install(0)).toEqual({ status: 0, calls: [COMMAND] })
  })

  it('tries again after a failed attempt', () => {
    expect(install(2)).toEqual({
      status: 0,
      calls: [COMMAND, COMMAND, COMMAND],
    })
  })

  it('gives up after three attempts with the last status', () => {
    expect(install(3)).toEqual({
      status: 100,
      calls: [COMMAND, COMMAND, COMMAND],
    })
  })
})

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

const INSTALL = 'run: bash ../.github/scripts/install-playwright.sh'

describe('ci.yml and the flakes', () => {
  it.each(['web-e2e', 'web-e2e-quarantine'])(
    'installs the browser with retries in %s',
    (name) => {
      expect(job(name)).toContain(INSTALL)
      expect(job(name)).not.toContain('run: npx playwright install')
    },
  )

  it('leaves quarantined tests out of the e2e shards', () => {
    expect(job('web-e2e')).toContain(
      'run: npx playwright test --shard=${{ matrix.shard }} --grep-invert @quarantine\n',
    )
  })

  it('runs the quarantined tests in a job of their own', () => {
    expect(job('web-e2e-quarantine')).toContain(
      'run: npx playwright test --grep @quarantine --pass-with-no-tests\n',
    )
  })

  it.each([INSTALL, '--grep @quarantine'])(
    'never turns the quarantine check red on the step with %s',
    (text) => {
      expect(step('web-e2e-quarantine', text)).toContain(
        'continue-on-error: true\n',
      )
    },
  )

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
