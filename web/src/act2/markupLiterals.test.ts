import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const LITERAL = /\[\/?(character_name|dialogue|event)\]/

/** Every non-test TypeScript file under `dir`, recursively. */
function contentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return contentFiles(path)
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : []
  })
}

/**
 * Written passages (journal pages, diaries, chronicles, the visitors' book)
 * are read out of a book, not spoken, so they keep their quote marks.
 */
// A new written constant must be added here by hand.
const WRITTEN_PASSAGES = ['MALAKAR_WARNING', 'VISITOR_ENTRY']
const QUOTE = /^['"]|['"]$/

/** The string pieces of a text, in order: literals, templates, `+` chains. */
function pieces(node: ts.Node): string[] {
  if (ts.isStringLiteralLike(node)) return [node.text]
  if (ts.isTemplateExpression(node)) {
    return [
      node.head.text,
      ...node.templateSpans.map((span) => span.literal.text),
    ]
  }
  if (ts.isBinaryExpression(node)) {
    return [...pieces(node.left), ...pieces(node.right)]
  }
  if (ts.isParenthesizedExpression(node)) return pieces(node.expression)
  return []
}

/** Whether `node` is a passage of written text: a `writing()` call or a known constant. */
function isWritten(node: ts.Node): boolean {
  if (ts.isCallExpression(node)) {
    return (
      ts.isIdentifier(node.expression) && node.expression.text === 'writing'
    )
  }
  return (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    WRITTEN_PASSAGES.includes(node.name.text)
  )
}

/**
 * The `file:line` of every text that is wrapped whole in quote marks, as a
 * spoken line was before the convention dropped them. Reading the whole text
 * (not just calls to `speech()`) also catches lines kept in constants.
 */
function wrappedInQuotes(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const found: string[] = []
  const visit = (node: ts.Node): void => {
    if (isWritten(node)) return
    const parts = pieces(node).filter((part) => part !== '')
    const first = parts[0]
    const last = parts[parts.length - 1]
    if (
      first !== undefined &&
      last !== undefined &&
      QUOTE.test(first[0]) &&
      QUOTE.test(last[last.length - 1]) &&
      (parts.length > 1 || first.length > 1)
    ) {
      const line = source.getLineAndCharacterOfPosition(node.getStart()).line
      found.push(`${file}:${line + 1}`)
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

describe('Act II markup', () => {
  it('is written through the engine helpers, never as hand-spelled tags', () => {
    const offenders = contentFiles(__dirname).filter((file) =>
      LITERAL.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('never wraps a line in quote marks of its own', () => {
    const offenders = contentFiles(__dirname).flatMap(wrappedInQuotes)
    expect(offenders).toEqual([])
  })
})
