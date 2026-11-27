/**
 * Tests for the CI skip: `.github/scripts/ci-needed.sh` answers `run=false`
 * only for a pull request whose whole diff is under `docs/`, and the CI
 * workflow runs its checks unless that answer was given.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(
  new URL('../.github/scripts/ci-needed.sh', import.meta.url),
)

/** The environment without `GIT_*`, so a git hook's repository never leaks in. */
const ENV = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
)

describe('ci-needed.sh', () => {
  let repo: string

  /** Runs git in the temporary repository. */
  function git(...args: string[]): void {
    const identity = [
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
    ]
    execFileSync('git', [...identity, '-c', 'commit.gpgsign=false', ...args], {
      cwd: repo,
      env: ENV,
      stdio: 'ignore',
    })
  }

  /** Writes `files` and commits everything in the temporary repository. */
  function commit(...files: string[]): void {
    for (const file of files) {
      mkdirSync(dirname(join(repo, file)), { recursive: true })
      writeFileSync(join(repo, file), `${file}\n`)
    }
    git('add', '--all')
    git('commit', '--allow-empty', '--message', 'change')
  }

  /** Runs the script in the temporary repository. */
  function ciNeeded(...args: string[]): {
    status: number | null
    stdout: string
  } {
    const { status, stdout } = spawnSync('bash', [SCRIPT, ...args], {
      cwd: repo,
      env: ENV,
      encoding: 'utf8',
    })
    return { status, stdout }
  }

  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'ci-needed-'))
    git('init')
    commit('web/src/old.ts')
  })

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true })
  })

  it('skips a pull request that only touches docs/', () => {
    commit('docs/ui/mockup.html', 'docs/retrospectives/rq-1.md')
    expect(ciNeeded('pull_request')).toEqual({
      status: 0,
      stdout: 'run=false\n',
    })
  })

  it('runs a pull request that touches anything beside docs/', () => {
    commit('docs/ui/mockup.html', 'web/src/new.ts')
    expect(ciNeeded('pull_request')).toEqual({
      status: 0,
      stdout: 'run=true\n',
    })
  })

  it.each([
    'web/docs/guide.md',
    'docs.md',
    'design/Voice.md',
    '.github/workflows/ci.yml',
  ])('runs a pull request that touches %s', (path) => {
    commit(path)
    expect(ciNeeded('pull_request').stdout).toBe('run=true\n')
  })

  it('runs a pull request that moves a file into docs/', () => {
    mkdirSync(join(repo, 'docs'))
    git('mv', 'web/src/old.ts', 'docs/old.ts')
    commit()
    expect(ciNeeded('pull_request').stdout).toBe('run=true\n')
  })

  it('runs a pull request with an empty diff', () => {
    commit()
    expect(ciNeeded('pull_request').stdout).toBe('run=true\n')
  })

  it.each(['push', 'workflow_dispatch'])(
    'runs everything on %s, even for docs only',
    (event) => {
      commit('docs/ui/mockup.html')
      expect(ciNeeded(event)).toEqual({ status: 0, stdout: 'run=true\n' })
    },
  )

  it('fails without an answer when there is no first parent to diff', () => {
    const { status, stdout } = ciNeeded('pull_request')
    expect(status).not.toBe(0)
    expect(stdout).toBe('')
  })

  it('fails without an answer when no event is given', () => {
    expect(ciNeeded()).toEqual({ status: 2, stdout: '' })
  })
})

const WORKFLOW = readFileSync(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)

const CONDITION = "needs.changes.outputs.run != 'false'"

/** The workflow's jobs by name, each as the text of its block. */
function jobs(): Map<string, string> {
  const body = WORKFLOW.slice(WORKFLOW.indexOf('\njobs:\n'))
  const blocks = body.split(/^ {4}(?=[\w-]+:$)/m).slice(1)
  return new Map(
    blocks.map((block) => [block.slice(0, block.indexOf(':')), block]),
  )
}

/** The text of the job called `name`. */
function job(name: string): string {
  const block = jobs().get(name)
  if (block === undefined) {
    throw new Error(`expected a job called ${name}`)
  }
  return block
}

describe('ci.yml', () => {
  it('decides with the script, from the merge commit and its first parent', () => {
    expect(job('changes')).toContain(
      'bash .github/scripts/ci-needed.sh "$EVENT" >> "$GITHUB_OUTPUT"',
    )
    expect(job('changes')).toContain('fetch-depth: 2')
    expect(job('changes')).toContain('run: ${{ steps.decide.outputs.run }}')
  })

  it('has no job that the skip tests do not know about', () => {
    expect([...jobs().keys()]).toEqual([
      'changes',
      'web-check',
      'web-test',
      'web-e2e',
      'web-e2e-quarantine',
      'container-smoke',
      'publish-image',
    ])
  })

  it.each(['web-check', 'web-test', 'web-e2e-quarantine', 'container-smoke'])(
    'runs %s unless the answer was to skip',
    (name) => {
      expect(job(name)).toContain('needs: changes\n')
      expect(job(name)).toContain(
        `\n        if: \${{ !cancelled() && ${CONDITION} }}\n`,
      )
    },
  )

  it('runs web-e2e for every shard, so each check reports under its own name', () => {
    expect(job('web-e2e')).toContain('needs: changes\n')
    expect(job('web-e2e')).toContain('\n        if: ${{ !cancelled() }}\n')
  })

  it('skips each web-e2e step when the answer was to skip', () => {
    const steps = job('web-e2e')
      .split('\n        steps:\n')[1]
      ?.split(/^ {12}- /m)
      .slice(1)
    expect(steps?.length).toBeGreaterThan(0)
    for (const step of steps ?? []) {
      expect(step).toContain(`if: ${CONDITION}`)
    }
  })
})
