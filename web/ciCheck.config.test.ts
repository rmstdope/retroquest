/**
 * Tests for the `web-check` job of the CI workflow (rq-pjqg): lint, the format
 * check, the type check and the build share one runner and one setup, each as a
 * step of its own that fails the job and is named in the run.
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

/** The steps of the job called `name`, each as the text of its block. */
function steps(name: string): string[] {
  return (
    job(name)
      .split('\n        steps:\n')[1]
      ?.split(/^ {12}- /m)
      .slice(1) ?? []
  )
}

/** Each step of `web-check` that runs a command, as its name and command. */
function commands(): [string | undefined, string | undefined][] {
  return steps('web-check')
    .filter((text) => /^ +run: /m.test(text))
    .map((text) => [
      /^name: (.+)$/m.exec(text)?.[1],
      /^ +run: (.+)$/m.exec(text)?.[1],
    ])
}

describe('ci.yml and the web-check job', () => {
  it('installs once, then lints, checks the format and the types, and builds', () => {
    expect(commands()).toEqual([
      ['Install dependencies', 'npm ci'],
      ['Lint', 'npx eslint .'],
      ['Format check', 'npx prettier --check "src/**/*.{ts,vue}" "*.config.*"'],
      ['Type check', 'npx vue-tsc --noEmit'],
      ['Build', 'npm run build'],
    ])
  })

  it('stops at the first step that fails, and fails with it', () => {
    expect(job('web-check')).not.toContain('continue-on-error')
    for (const step of steps('web-check')) {
      expect(step).not.toMatch(/^(?: +)?if:/m)
    }
  })

  it('holds the image back when it fails', () => {
    expect(job('publish-image')).toContain(
      'needs: [web-check, web-test, web-e2e, container-smoke]\n',
    )
  })
})
