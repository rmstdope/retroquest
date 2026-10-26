import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

describe('the speaking rule', () => {
  it('is drawn once, in lantern.css, for chapter blocks and story blocks', () => {
    const css = read('./lantern.css')
    expect(css).toMatch(
      /\.lq-chapter-block\.lq-speaking[\s\S]*?inset var\(--lq-rule-width/,
    )
    expect(css).toMatch(/\.lq-block-text\.lq-speaking/)
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
