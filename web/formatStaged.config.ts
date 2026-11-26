/**
 * The pre-commit formatting step: ESLint's fixes, then Prettier, on every
 * staged `.ts` and `.vue` file under `web/src` of the repository it is run in.
 * `.beads/hooks/pre-commit` runs this file with `node`.
 *
 * It formats the staged content, not the working file, and writes the result to
 * the index. The working file follows only when it has no unstaged changes, so
 * nothing unstaged is ever committed or overwritten, and no `git stash` is used
 * (the stash stack is shared between worktrees).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { ESLint } from 'eslint'
import * as prettier from 'prettier'

const SOURCE_DIR = 'web/src'
const SOURCE_FILE = /\.(ts|vue)$/
/** The modes git gives a regular file; a symlink or submodule is left alone. */
const REGULAR_FILE_MODES = ['100644', '100755']
/** The temporary index of `git commit <paths>`. */
const PARTIAL_COMMIT_INDEX = /^next-index-.*\.lock$/

type Environment = Record<string, string | undefined>

/** Runs git in `root` and answers what it prints. */
function git(
  root: string,
  env: Environment,
  args: string[],
  input?: string,
): string {
  return execFileSync('git', args, {
    cwd: root,
    env,
    input,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

/** The mode and blob of `path` in the index, or null when it is not there. */
function indexEntry(
  root: string,
  env: Environment,
  path: string,
): { mode: string; blob: string } | null {
  const line = git(root, env, [
    '--literal-pathspecs',
    'ls-files',
    '--stage',
    '--',
    path,
  ])
  const [mode, blob] = line.split(/\s/)
  return mode && blob ? { mode, blob } : null
}

/** `code` as ESLint's fixes and then Prettier leave it. */
async function tidy(
  eslint: ESLint,
  file: string,
  ignorePath: string,
  code: string,
): Promise<string> {
  const info = await prettier.getFileInfo(file, { ignorePath })
  const [result] = await eslint.lintText(code, {
    filePath: file,
    warnIgnored: false,
  })
  const fixed = result?.output ?? code
  if (info.ignored) return fixed
  const options = await prettier.resolveConfig(file, { editorconfig: true })
  return prettier.format(fixed, { ...options, filepath: file })
}

/**
 * Formats and lint-fixes the staged source files of the repository at `root`
 * and answers the paths it rewrote. A file a tool cannot read is reported on
 * stderr and left as it is.
 */
async function formatStaged(root: string, env: Environment): Promise<string[]> {
  const staged = git(root, env, [
    'diff',
    '--cached',
    '--name-only',
    '--diff-filter=ACMR',
    '-z',
    '--',
    SOURCE_DIR,
  ])
    .split('\0')
    .filter((path) => SOURCE_FILE.test(path))
  if (staged.length === 0) return []

  const webDir = join(realpathSync(root), 'web')
  const eslint = new ESLint({ cwd: webDir, fix: true })
  const indexes = [env]
  // `git commit <paths>` commits from a temporary index and afterwards installs
  // `index.lock` as the real one, so both need the formatted file.
  if (PARTIAL_COMMIT_INDEX.test(basename(env.GIT_INDEX_FILE ?? ''))) {
    const gitDir = git(root, env, ['rev-parse', '--absolute-git-dir']).trim()
    indexes.push({ ...env, GIT_INDEX_FILE: join(gitDir, 'index.lock') })
  }

  const changed: string[] = []
  for (const path of staged) {
    const entry = indexEntry(root, env, path)
    if (!entry || !REGULAR_FILE_MODES.includes(entry.mode)) continue
    const before = git(root, env, ['cat-file', 'blob', entry.blob])
    let after: string
    try {
      after = await tidy(
        eslint,
        join(realpathSync(root), path),
        join(webDir, '.prettierignore'),
        before,
      )
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error(`format-staged: ${path}: ${reason.split('\n')[0]}`)
      continue
    }
    if (after === before) continue

    const blob = git(root, env, ['hash-object', '-w', '--stdin'], after).trim()
    for (const index of indexes) {
      git(root, index, [
        'update-index',
        '--cacheinfo',
        `${entry.mode},${blob},${path}`,
      ])
    }
    const file = join(root, path)
    if (existsSync(file) && readFileSync(file, 'utf8') === before) {
      writeFileSync(file, after)
    }
    changed.push(path)
  }
  return changed
}

const root = git(process.cwd(), process.env, [
  'rev-parse',
  '--show-toplevel',
]).trim()
for (const path of await formatStaged(root, process.env)) {
  console.error(`format-staged: formatted ${path}`)
}
