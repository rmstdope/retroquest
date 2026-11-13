/**
 * Finds the lines an act's content can speak that its narration script lacks.
 * The script (`tts/act<N>/script.json`) holds only what the golden path, the
 * probes and the branches of `branches.json` reach, so a line added anywhere
 * else would stay out of it silently. `authoredLines` reads the string
 * literals of content files, `unreachedLines` keeps those found in no script
 * line and not acknowledged in `tts/act<N>/unreached.json`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import ts from 'typescript'
import type { ScriptLine } from './narrationScript'

/** A source file: its repository path and its text. */
export interface SourceFile {
  file: string
  text: string
}

/** One authored line: the file it is in and its words, markup removed. */
export interface AuthoredLine {
  file: string
  text: string
}

/** Shortest literal taken for a spoken line, in characters. */
const MIN_LENGTH = 30

/** How much of a line `unreached.json` records to name it. */
const KEY_LENGTH = 60

/** Words as the script holds them: markup tags removed, whitespace collapsed. */
function plain(text: string): string {
  return text
    .replace(/\[\/?[a-z_-]+[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The key by which `unreached.json` acknowledges a line: its first words. */
export function acknowledgedKey(text: string): string {
  return plain(text).slice(0, KEY_LENGTH)
}

/** The text of a string literal, or null when `node` is anything else. */
function literalText(node: ts.Node): string | null {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
    ? node.text
    : null
}

/** The pieces of a `+` chain of literals, or null when part of it is not a literal. */
function chain(node: ts.Expression): string[] | null {
  const text = literalText(node)
  if (text !== null) return [text]
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = chain(node.left)
    const right = chain(node.right)
    return left && right ? [...left, ...right] : null
  }
  return null
}

/** Whether `node` is the operand of a `+` (so its chain, not it alone, is the line). */
function isOperand(node: ts.Node): boolean {
  return (
    ts.isBinaryExpression(node.parent) &&
    node.parent.operatorToken.kind === ts.SyntaxKind.PlusToken
  )
}

/** The string literals (and `+` chains of them) of `files` that read as spoken lines. */
export function authoredLines(files: SourceFile[]): AuthoredLine[] {
  const lines: AuthoredLine[] = []
  for (const { file, text } of files) {
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    const visit = (node: ts.Node): void => {
      const whole = ts.isExpression(node) ? chain(node) : null
      if (whole && (!isOperand(node) || literalText(node) === null)) {
        const words = plain(whole.join(''))
        if (words.length >= MIN_LENGTH && words.includes(' '))
          lines.push({ file, text: words })
        if (!isOperand(node)) return
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return lines
}

/**
 * Whether `text` is made up of whole script lines, in any order, with at most
 * the end of a line before them and the start of a line after them: the script is
 * kept in id order, so a literal the game says as several lines is no longer
 * found by reading the script from top to bottom. `pieces` are the script's lines,
 * longest first.
 */
function isSpokenInPieces(text: string, pieces: string[]): boolean {
  const gap = '\u0000'
  let rest = text
  for (const piece of pieces)
    if (rest.includes(piece)) rest = rest.split(piece).join(gap)
  const parts = rest.split(gap).map((part) => part.trim())
  if (parts.length === 1) return false
  const first = parts[0]
  const last = parts[parts.length - 1]
  return (
    parts.slice(1, -1).every((part) => part === '') &&
    (first === '' || pieces.some((piece) => piece.endsWith(first))) &&
    (last === '' || pieces.some((piece) => piece.startsWith(last)))
  )
}

/** The authored lines found in no script line and not acknowledged by their key. */
export function unreachedLines(
  authored: AuthoredLine[],
  script: ScriptLine[],
  acknowledged: string[],
): AuthoredLine[] {
  const spoken = plain(script.map((line) => line.text).join('\n'))
  const pieces = script
    .map((line) => plain(line.text))
    .filter((text) => text.length > 0)
    .sort((a, b) => b.length - a.length)
  return authored.filter(
    (line) =>
      !spoken.includes(line.text) &&
      !isSpokenInPieces(line.text, pieces) &&
      !acknowledged.includes(acknowledgedKey(line.text)),
  )
}

/** The acknowledged keys that no unreached authored line has any more: reached, reworded or deleted. */
export function staleAcknowledgements(
  authored: AuthoredLine[],
  script: ScriptLine[],
  acknowledged: string[],
): string[] {
  const unreached = new Set(
    unreachedLines(authored, script, []).map((line) =>
      acknowledgedKey(line.text),
    ),
  )
  return acknowledged.filter((key) => !unreached.has(key))
}

/** Files that hold no spoken lines: the golden path's commands, the act's own music credits, and the room patches' words for the picture studio. */
const SKIPPED = /^(Act\d(GoldenPath)?|roomPatches)\.ts$/

/** Every non-test TypeScript file under `src/act<act>` (but not the act class or its golden path) of the web project at `webRoot`, with its text. */
export function contentFiles(
  webRoot: string,
  act: number | string,
): SourceFile[] {
  const files: SourceFile[] = []
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = `${dir}/${name}`
      if (statSync(path).isDirectory()) walk(path)
      else if (
        path.endsWith('.ts') &&
        !path.includes('.test.') &&
        !SKIPPED.test(name)
      )
        files.push({ file: path, text: readFileSync(path, 'utf8') })
    }
  }
  walk(`${webRoot}/src/act${act}`)
  return files
}
