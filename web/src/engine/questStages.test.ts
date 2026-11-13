import { describe, it, expect } from 'vitest'

const sources = import.meta.glob<string>('../act[123]/quests/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('quests of acts I to III', () => {
  it('leave the reached order of their journal to the engine', () => {
    const copies = Object.entries(sources)
      .filter(([path]) => !path.endsWith('.test.ts'))
      .filter(([, text]) => /flagState|noteFlag|noted:/.test(text))
      .map(([path]) => path)
    expect(copies).toEqual([])
  })
})
