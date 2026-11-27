/**
 * Tests for the concurrency group of the CI workflow (rq-9h6a): a pull request
 * pushed again stops the run of the head it replaced, and no other run, on main
 * or called from another workflow, is ever cancelled or made to wait.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const WORKFLOW = readFileSync(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)

/** The parts of the `github` context the concurrency block reads. */
interface Context {
  event_name: string
  workflow_ref: string
  run_id: number
  event: { pull_request?: { number: number } }
}

/** The one-line key `key` of the workflow's top-level concurrency block. */
function setting(key: string): string {
  const block = /^concurrency:\n((?: {4}.*\n)+)/m.exec(WORKFLOW)?.[1] ?? ''
  const found = new RegExp(`^ {4}${key}: (.+)$`, 'm').exec(block)?.[1]
  if (found === undefined) {
    throw new Error(`expected concurrency.${key}`)
  }
  return found
}

/**
 * Fills in the `${{ }}` expressions of `template` as Actions would. The
 * operators and functions the block uses behave the same in JavaScript.
 */
function expand(template: string, github: Context): string {
  return template.replace(/\$\{\{(.+?)\}\}/g, (_match, expression: string) => {
    const evaluate = new Function(
      'github',
      'startsWith',
      'format',
      `return (${expression.replaceAll('==', '===')})`,
    )
    return String(
      evaluate(
        github,
        (text: string, prefix: string) => text.startsWith(prefix),
        (pattern: string, value: unknown) =>
          pattern.replace('{0}', String(value)),
      ),
    )
  })
}

/** What a run in the context `github` does about the other runs. */
function concurrency(github: Context): { group: string; cancels: string } {
  return {
    group: expand(setting('group'), github),
    cancels: expand(setting('cancel-in-progress'), github),
  }
}

const OWN = 'rmstdope/retroquest/.github/workflows/ci.yml@'

/** A run of this workflow for a push to the pull request `number`. */
function pullRequest(number: number, runId: number): Context {
  return {
    event_name: 'pull_request',
    workflow_ref: `${OWN}refs/pull/${number}/merge`,
    run_id: runId,
    event: { pull_request: { number } },
  }
}

/** A run of this workflow for a push to main. */
function mainPush(runId: number): Context {
  return {
    event_name: 'push',
    workflow_ref: `${OWN}refs/heads/main`,
    run_id: runId,
    event: {},
  }
}

describe('ci.yml and superseded runs', () => {
  it('cancels the run of the head a pull request replaced', () => {
    const first = concurrency(pullRequest(7, 100))
    const second = concurrency(pullRequest(7, 101))
    expect(second.group).toBe(first.group)
    expect(second.cancels).toBe('true')
  })

  it('keeps two pull requests apart', () => {
    expect(concurrency(pullRequest(7, 100)).group).not.toBe(
      concurrency(pullRequest(8, 101)).group,
    )
  })

  it('never cancels or holds back a run on main', () => {
    const first = concurrency(mainPush(100))
    const second = concurrency(mainPush(101))
    expect(second.group).not.toBe(first.group)
    expect(first.cancels).toBe('false')
    expect(second.cancels).toBe('false')
  })

  it.each([
    [
      'another workflow, on a pull request',
      'rmstdope/retroquest/.github/workflows/release.yml@refs/pull/7/merge',
    ],
    [
      "another repository's ci.yml",
      'someone/else/.github/workflows/ci.yml@refs/pull/7/merge',
    ],
  ])('leaves a run called from %s alone', (_caller, workflowRef) => {
    const called = concurrency({
      ...pullRequest(7, 200),
      workflow_ref: workflowRef,
    })
    expect(called.cancels).toBe('false')
    expect(called.group).not.toBe(concurrency(pullRequest(7, 100)).group)
    expect(called.group).toBe(concurrency(mainPush(200)).group)
  })
})
