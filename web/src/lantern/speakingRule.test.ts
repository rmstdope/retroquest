import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

describe('the speaking rule', () => {
  it.each([
    '.lq-chapter-block',
    '.lq-block-text',
    '.lq-block-dialogue',
    '.lq-block-failure',
    '.lq-arrival',
  ])('is drawn once, in lantern.css, for %s', (selector) => {
    const rule = read('./lantern.css').match(
      /([^{}]*)\{\s*box-shadow: inset var\(--lq-rule-width[^}]*\}/,
    )
    expect(rule?.[1]).toContain(`${selector}.lq-speaking`)
  })

  it('draws a clue failure 3px in the failure colour', () => {
    const source = read('../components/lantern/StoryTurn.vue')
    expect(source).toMatch(
      /\.lq-block-failure\.lq-speaking\s*\{[^}]*--lq-rule-width: 3px/,
    )
    expect(source).toMatch(/--lq-rule-colour: var\(--lq-failure\)/)
  })

  it.each(['ChapterPage.vue', 'StoryTurn.vue'])(
    '%s declares no rule of its own',
    (file) => {
      expect(read(`../components/lantern/${file}`)).not.toMatch(
        /box-shadow:\s*inset/,
      )
    },
  )
})
