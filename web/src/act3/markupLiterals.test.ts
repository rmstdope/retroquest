import { describe, expect, it } from 'vitest'

const SOURCES = import.meta.glob<string>(['./**/*.ts', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

const TAG_LITERAL = /\[\/?(character_name|dialogue|event)\]/

describe('Act III content', () => {
  it('has content files to check', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(40)
  })

  it('writes dialogue and events through the engine markup helpers', () => {
    const offenders = Object.entries(SOURCES)
      .filter(([, source]) => TAG_LITERAL.test(source))
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })
})
