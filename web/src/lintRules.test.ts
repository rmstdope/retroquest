import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

/** Lint a snippet as if it lived at `filePath`, and return the rule ids it breaks. */
async function lint(code: string, filePath: string): Promise<string[]> {
  const eslint = new ESLint({ cwd: process.cwd() })
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.map((m) => m.ruleId ?? '')
}

const CONTENT = 'src/act1/items/Probe.ts'

describe('the content name-comparison rule', () => {
  it.each([
    "export const a = (r: { name: string }): boolean => r.name === 'Cavern'",
    "export const a = (r: { name: string }): boolean => r.name !== 'Cavern'",
    "export const a = (r: { name: string }): boolean => 'Cavern' === r.name",
    "export const a = (r: { name: string }): boolean => r.name.toLowerCase() === 'cavern'",
    'export const a = (r: { name: string }): boolean => r.name === `Cavern`',
    "export const a = (r?: { name: string }): boolean => r?.name === 'Cavern'",
  ])('flags %s in act and lantern content', async (code) => {
    expect(await lint(code, CONTENT)).toContain('no-restricted-syntax')
    expect(await lint(code, 'src/lantern/Probe.ts')).toContain(
      'no-restricted-syntax',
    )
  })

  it.each([
    'export const a = (r: { name: string }, n: string): boolean => r.name === n',
    "export const a = (r: { key: string }): boolean => r.key === 'x'",
    "export const a = (n: string): boolean => n === 'rope'",
  ])('lets %s through', async (code) => {
    expect(await lint(code, CONTENT)).not.toContain('no-restricted-syntax')
  })

  it('leaves test files and the engine alone', async () => {
    const code =
      "export const a = (r: { name: string }): boolean => r.name === 'x'"
    expect(await lint(code, 'src/act1/items/Probe.test.ts')).not.toContain(
      'no-restricted-syntax',
    )
    expect(await lint(code, 'src/engine/Probe.ts')).not.toContain(
      'no-restricted-syntax',
    )
  })
})

describe('the content story-flag rule', () => {
  const flagCall = (call: string): string =>
    'export const a = (s: { setStoryFlag(f: string, v: boolean): void; ' +
    `getStoryFlag(f: string): boolean }, c: boolean, n: number): void => { s.${call} }`

  it.each([
    "setStoryFlag('x', true)",
    "getStoryFlag('x')",
    'setStoryFlag(`x`, true)',
    'getStoryFlag(`riddle_${n}`)',
    "setStoryFlag(c ? 'x' : 'y', true)",
  ])('flags %s in act and lantern content', async (call) => {
    expect(await lint(flagCall(call), CONTENT)).toContain(
      'no-restricted-syntax',
    )
    expect(await lint(flagCall(call), 'src/lantern/Probe.ts')).toContain(
      'no-restricted-syntax',
    )
  })

  it('lets a constant through, and leaves test files alone', async () => {
    const constant =
      "const FLAG = 'x'\n" + flagCall('setStoryFlag(c ? FLAG : FLAG, true)')
    expect(await lint(constant, CONTENT)).not.toContain('no-restricted-syntax')
    expect(
      await lint(flagCall("getStoryFlag('x')"), 'src/act1/items/Probe.test.ts'),
    ).not.toContain('no-restricted-syntax')
  })
})

describe('the content name-alias rule', () => {
  const probe = (body: string): string =>
    'export const a = (r: { name: string }, o: string): unknown => { ' +
    `${body} }`

  it.each([
    "const n = r.name; return n === 'Cavern'",
    "const n = r.name; return 'Cavern' !== n",
    "const n = r.name.toLowerCase(); return n == 'cavern'",
    'const n = r?.name; return n != `Cavern`',
    "const n = r.name; return n.includes('Cave')",
    "const n = r.name; return n.toLowerCase().includes('cave')",
    "const n = r.name.toLowerCase(); return ['a'].some((w) => n.includes(w))",
    "const n = r.name; return n.startsWith('C') || o",
    "const n = r.name; return n.endsWith('n') || o",
    "const n = r.name; switch (n) { case 'Cavern': return o } return null",
    "return r.name.includes('Cave') || o",
    "switch (r.name) { case 'Cavern': return o } return null",
    "const { name } = r; return name === 'Cavern'",
    "const { name: n } = r; return n.includes('Cave')",
    "return r.name.toLowerCase().includes('cave') || o",
  ])('flags %s in act and lantern content', async (body) => {
    expect(await lint(probe(body), CONTENT)).toContain('content/no-name-alias')
    expect(await lint(probe(body), 'src/lantern/Probe.ts')).toContain(
      'content/no-name-alias',
    )
  })

  it.each([
    'const n = r.name; return `You see ${n}.` + o',
    'const n = r.name; return n === o',
    "const v = (r as unknown as Record<string, string>)[o]; return v === 'x'",
    'const { length: name } = o; return String(name) + r.name',
    "const n = o; return n === 'Cavern' || n.includes('C')",
    "const n = r.name; return [o].map((n) => n === 'x').concat(n === o)",
  ])('lets %s through', async (body) => {
    expect(await lint(probe(body), CONTENT)).not.toContain(
      'content/no-name-alias',
    )
  })

  it('leaves test files alone', async () => {
    const code = probe("const n = r.name; return n === 'x'")
    expect(await lint(code, 'src/act1/items/Probe.test.ts')).not.toContain(
      'content/no-name-alias',
    )
  })
})
