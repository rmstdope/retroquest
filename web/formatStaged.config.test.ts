/**
 * Tests for the pre-commit formatting of staged files (`formatStaged.config.ts`),
 * on real git repositories that use this project's ESLint and Prettier
 * configuration. Each `describe` builds its repository once.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(WEB, 'formatStaged.config.ts')
const HOOK = join(WEB, '..', '.beads', 'hooks', 'pre-commit')

/** The environment without `GIT_*`, so a git hook's repository never leaks in. */
const ENV = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
)

/** Needs `prefer-const` fixed and Prettier's formatting. */
const UNTIDY = 'export let answer   =  "42";\n'
const TIDY = "export const answer = '42'\n"

/** Needs `v-bind:` shortened (an ESLint fix) and Prettier's formatting. */
const UNTIDY_VUE =
  '<script setup lang="ts">\nconst answer   =  "42";\n</script>\n\n' +
  '<template><p v-bind:title="answer">{{ answer }}</p></template>\n'
const TIDY_VUE =
  '<script setup lang="ts">\nconst answer = \'42\'\n</script>\n\n' +
  '<template>\n  <p :title="answer">{{ answer }}</p>\n</template>\n'

/**
 * A temporary repository with one commit, holding this project's ESLint and
 * Prettier configuration and a link to its installed packages.
 */
function createRepository(): string {
  const repo = mkdtempSync(join(tmpdir(), 'format-staged-'))
  const git = (...args: string[]): void => {
    execFileSync('git', args, { cwd: repo, env: ENV, stdio: 'ignore' })
  }
  git('init')
  git('config', 'user.name', 'test')
  git('config', 'user.email', 'test@example.com')
  git('config', 'commit.gpgsign', 'false')
  mkdirSync(join(repo, 'web'))
  for (const file of [
    'package.json',
    'eslint.config.js',
    '.prettierrc',
    '.prettierignore',
  ]) {
    copyFileSync(join(WEB, file), join(repo, 'web', file))
  }
  symlinkSync(join(WEB, 'node_modules'), join(repo, 'web', 'node_modules'))
  writeFileSync(join(repo, '.gitignore'), 'node_modules\n.tmp\n')
  git('add', '--all')
  git('commit', '--message', 'start')
  return repo
}

describe('formatStaged', { timeout: 120_000 }, () => {
  const outOfScope = [
    'web/other.ts',
    'web/src/data.json',
    'web/src/unstaged.ts',
  ]
  let repo: string
  let run: { status: number | null; stderr: string }

  /** Runs git in the temporary repository and answers what it prints. */
  function git(...args: string[]): string {
    return execFileSync('git', args, {
      cwd: repo,
      env: ENV,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  }

  /** Writes a file of the temporary repository. */
  function write(file: string, content: string): void {
    mkdirSync(dirname(join(repo, file)), { recursive: true })
    writeFileSync(join(repo, file), content)
  }

  /** The working tree's copy of a file. */
  function working(file: string): string {
    return readFileSync(join(repo, file), 'utf8')
  }

  /** The staged copy of a file. */
  function staged(file: string): string {
    return git('show', `:${file}`)
  }

  // One run of the script serves every case: each stages files of its own.
  beforeAll(() => {
    repo = createRepository()
    write('web/src/answer.ts', UNTIDY)
    write('web/src/components/Answer.vue', UNTIDY_VUE)
    write('web/src/partial.ts', UNTIDY)
    write('web/src/broken.ts', 'export const = (\n')
    for (const file of outOfScope) write(file, UNTIDY)
    git(
      'add',
      'web/src/answer.ts',
      'web/src/components/Answer.vue',
      'web/src/partial.ts',
      'web/src/broken.ts',
      'web/other.ts',
      'web/src/data.json',
    )
    write('web/src/partial.ts', `${UNTIDY}// not staged\n`)

    run = spawnSync(process.execPath, [SCRIPT], {
      cwd: repo,
      env: ENV,
      encoding: 'utf8',
    })
  }, 120_000)

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true })
  })

  it('formats and lint-fixes staged files, in the index and the tree', () => {
    expect(run.status, run.stderr).toBe(0)
    expect(staged('web/src/answer.ts')).toBe(TIDY)
    expect(working('web/src/answer.ts')).toBe(TIDY)
    expect(staged('web/src/components/Answer.vue')).toBe(TIDY_VUE)
    expect(working('web/src/components/Answer.vue')).toBe(TIDY_VUE)
  })

  it('never stages or overwrites the unstaged part of a file', () => {
    expect(staged('web/src/partial.ts')).toBe(TIDY)
    expect(working('web/src/partial.ts')).toBe(`${UNTIDY}// not staged\n`)
  })

  it('leaves unstaged files and files outside its scope alone', () => {
    // The whole report: it names no file but the staged ones in scope.
    expect(run.stderr.trimEnd().split('\n')).toEqual([
      expect.stringContaining('format-staged: web/src/broken.ts:'),
      'format-staged: formatted web/src/answer.ts',
      'format-staged: formatted web/src/components/Answer.vue',
      'format-staged: formatted web/src/partial.ts',
    ])
    for (const file of outOfScope) expect(working(file)).toBe(UNTIDY)
    expect(staged('web/other.ts')).toBe(UNTIDY)
    expect(staged('web/src/data.json')).toBe(UNTIDY)
  })

  it('reports a file it cannot parse and still formats the others', () => {
    expect(run.stderr).toContain('format-staged: web/src/broken.ts:')
    // `partial.ts` comes after the broken file.
    expect(run.stderr).toContain('formatted web/src/partial.ts')
    expect(staged('web/src/broken.ts')).toBe('export const = (\n')
    expect(staged('web/src/partial.ts')).toBe(TIDY)
  })
})

describe('the pre-commit hook', { timeout: 120_000 }, () => {
  let repo: string
  let base: string
  let beadsLog: string
  let env: Record<string, string | undefined>

  /** Runs git in the temporary repository, with the stub `bd` on the PATH. */
  function git(...args: string[]): string {
    return execFileSync('git', args, {
      cwd: repo,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  }

  beforeAll(() => {
    repo = createRepository()
    beadsLog = join(repo, '.tmp', 'bd.log')
    const bin = join(repo, '.tmp', 'bin')
    mkdirSync(bin, { recursive: true })
    writeFileSync(join(bin, 'bd'), '#!/bin/sh\necho "$*" >> "$BD_LOG"\n', {
      mode: 0o755,
    })
    env = {
      ...ENV,
      PATH: `${bin}${delimiter}${ENV.PATH}`,
      BD_LOG: beadsLog,
    }
    mkdirSync(join(repo, '.beads', 'hooks'), { recursive: true })
    copyFileSync(HOOK, join(repo, '.beads', 'hooks', 'pre-commit'))
    copyFileSync(SCRIPT, join(repo, 'web', 'formatStaged.config.ts'))
    git('add', '.beads', 'web/formatStaged.config.ts')
    git('commit', '--message', 'add the hook')
    base = git('rev-parse', 'HEAD').trim()
    git('config', 'core.hooksPath', '.beads/hooks')
  }, 120_000)

  // Back to the commit that added the hook; ignored files (`.tmp`) stay.
  beforeEach(() => {
    git('reset', '--hard', base)
    git('clean', '--force', '-d')
    rmSync(beadsLog, { force: true })
  })

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true })
  })

  it('runs the beads hook and commits staged files formatted', () => {
    const file = join(repo, 'web/src/answer.ts')
    mkdirSync(dirname(file), { recursive: true })

    // The three ways to commit each use the index differently.
    writeFileSync(file, UNTIDY)
    git('add', 'web/src')
    git('commit', '--message', 'plain')
    expect(git('show', 'HEAD:web/src/answer.ts')).toBe(TIDY)
    expect(git('status', '--porcelain', 'web/src')).toBe('')

    writeFileSync(file, UNTIDY.replace('42', '43'))
    git('commit', '--all', '--message', 'all')
    expect(git('show', 'HEAD:web/src/answer.ts')).toBe(TIDY.replace('42', '43'))
    expect(git('status', '--porcelain', 'web/src')).toBe('')

    writeFileSync(file, UNTIDY.replace('42', '44'))
    git('commit', '--message', 'paths', '--', 'web/src/answer.ts')
    expect(git('show', 'HEAD:web/src/answer.ts')).toBe(TIDY.replace('42', '44'))
    expect(git('status', '--porcelain', 'web/src')).toBe('')

    expect(readFileSync(beadsLog, 'utf8')).toContain('hooks run pre-commit')
  })

  it('lets the commit through when the formatting step fails', () => {
    writeFileSync(
      join(repo, 'web', 'formatStaged.config.ts'),
      'process.exit(1)\n',
    )
    mkdirSync(join(repo, 'web/src'), { recursive: true })
    writeFileSync(join(repo, 'web/src/answer.ts'), UNTIDY)
    git('add', 'web/src')
    git('commit', '--message', 'broken step')

    expect(git('show', 'HEAD:web/src/answer.ts')).toBe(UNTIDY)
  })

  it('lets the commit through in a tree without the formatting step', () => {
    rmSync(join(repo, 'web', 'formatStaged.config.ts'))
    mkdirSync(join(repo, 'web/src'), { recursive: true })
    writeFileSync(join(repo, 'web/src/answer.ts'), UNTIDY)
    git('add', 'web/src')
    git('commit', '--message', 'no step')

    expect(git('show', 'HEAD:web/src/answer.ts')).toBe(UNTIDY)
  })
})
