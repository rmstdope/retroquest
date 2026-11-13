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
