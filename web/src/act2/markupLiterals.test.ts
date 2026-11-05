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

/** Whether `node` is a call of `characterName(...)`. */
function isCharacterNameCall(node: ts.Node): boolean {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'characterName'
  )
}

/** The operands of a `+` chain, in order, looking through parentheses. */
function operands(node: ts.Node): ts.Node[] {
  if (ts.isParenthesizedExpression(node)) return operands(node.expression)
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    return [...operands(node.left), ...operands(node.right)]
  }
  return [node]
}

/** Whether `node` is a call of `speech(...)`. */
function isSpeechCall(node: ts.Node): boolean {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'speech'
  )
}

/**
 * The `file:line` of every speaker label assembled by hand: a text starting
 * with `: ` directly before a `speech(...)` call in a `+` chain, whoever the
 * label names (a `characterName(...)` call or a variable holding one), or a
 * `characterName(...)` directly followed by `: ` in a template.
 * `dialogue(speaker, words)` writes the label.
 */
function handAssembledLabels(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const found: string[] = []
  const report = (node: ts.Node): void => {
    const line = source.getLineAndCharacterOfPosition(node.getStart()).line
    found.push(`${file}:${line + 1}`)
  }
  const visit = (node: ts.Node): void => {
    if (ts.isTemplateExpression(node)) {
      node.templateSpans.forEach((span) => {
        if (isCharacterNameCall(span.expression) && span.literal.text === ': ')
          report(span)
      })
    } else if (ts.isBinaryExpression(node)) {
      const parts = operands(node)
      if (parts.length > 1) {
        parts.forEach((part, index) => {
          const next = parts[index + 1]
          if (
            ts.isStringLiteralLike(part) &&
            part.text.startsWith(': ') &&
            next !== undefined &&
            isSpeechCall(next)
          )
            report(part)
        })
        parts.forEach(visit)
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

/** Whether `node` is a call of `speech(...)` or `dialogue(...)`: a quote. */
function isQuoteCall(node: ts.Node): boolean {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    (node.expression.text === 'speech' || node.expression.text === 'dialogue')
  )
}

/** The text a string or template operand ends with, or `undefined` for any other node. */
function trailingText(node: ts.Node): string | undefined {
  if (ts.isStringLiteralLike(node)) return node.text
  if (ts.isTemplateExpression(node)) {
    return node.templateSpans[node.templateSpans.length - 1]?.literal.text
  }
  return undefined
}

/** Whether `text` ends in a colon, ignoring trailing whitespace. */
function endsInColon(text: string | undefined): boolean {
  return text !== undefined && text.trimEnd().endsWith(':')
}

/**
 * The `file:line` of every narration that only introduces a quote: a text
 * ending in a colon directly before a `speech(...)` or `dialogue(...)` call in
 * a `+` chain, whitespace-only pieces between them skipped, or directly
 * before such a call in a template ("One of them adds, more quietly:"). The
 * story view shows such a line as a card of its own, standing apart from the
 * words it leads into.
 */
function colonLeadIns(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const found: string[] = []
  const report = (node: ts.Node): void => {
    const line = source.getLineAndCharacterOfPosition(node.getStart()).line
    found.push(`${file}:${line + 1}`)
  }
  const visit = (node: ts.Node): void => {
    if (ts.isTemplateExpression(node)) {
      const texts = [
        node.head.text,
        ...node.templateSpans.map((span) => span.literal.text),
      ]
      node.templateSpans.forEach((span, index) => {
        if (endsInColon(texts[index]) && isQuoteCall(span.expression))
          report(span)
      })
    } else if (ts.isBinaryExpression(node)) {
      // Whitespace-only pieces ('\n\n') render nothing between the two.
      const parts = operands(node).filter(
        (part) => !(ts.isStringLiteralLike(part) && part.text.trim() === ''),
      )
      if (parts.length > 1) {
        parts.forEach((part, index) => {
          const next = parts[index + 1]
          if (
            endsInColon(trailingText(part)) &&
            next !== undefined &&
            isQuoteCall(next)
          )
            report(part)
        })
        parts.forEach(visit)
        return
      }
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

  it('never assembles a speaker label by hand', () => {
    const offenders = contentFiles(__dirname).flatMap(handAssembledLabels)
    expect(offenders).toEqual([])
  })

  it('leaves no narration that only introduces a quote (rq-lb90)', () => {
    const offenders = contentFiles(__dirname).flatMap(colonLeadIns)
    expect(offenders).toEqual([])
  })
})
