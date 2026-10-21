import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { CharredNotebook } from './CharredNotebook'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('CharredNotebook', () => {
  it('is a carriable item with the short name notebook', () => {
    const notebook = new CharredNotebook()
    expect(notebook.name).toBe('Charred Notebook')
    expect(notebook.shortName).toBe('notebook')
    expect(notebook.canBeCarried).toBe(true)
  })

  it('shows the opening line, both entries and the closing line', () => {
    const game = new Game([new Act3()])
    const text = new CharredNotebook().examine(game.state)
    expectMarkupWellFormed(text)
    expect(text).toContain('Most pages have crumbled to flakes; two survive')
    expect(text).toContain('Lysa says I measure the light too carefully.')
    expect(text).toContain('The Wasting has reached Willowbrook.')
    expect(text).toContain('I have waited all my life.')
    expect(text).toContain(
      'The second entry is pressed so hard into the page that the pen has torn it.',
    )
    expect(text).toContain("The names in it are your parents'.")
    expect(text).toContain(
      'Aren says that is why it never misses. We set the third mirror today, and the whole terrace caught fire with it, the good kind.',
    )
    expect(text).toContain(
      'Aren sits up with her and pretends he is not afraid. They tell me to wait.',
    )
    expect(text.indexOf('Lysa says')).toBeLessThan(text.indexOf('The Wasting'))
  })

  it('reads the same every time and changes nothing', () => {
    const game = new Game([new Act3()])
    const notebook = new CharredNotebook()
    const before = JSON.stringify(game.toSaveData())
    const first = notebook.examine(game.state)
    expect(notebook.examine(game.state)).toBe(first)
    expect(JSON.stringify(game.toSaveData())).toBe(before)
    expect(first).not.toContain('glow')
  })
})
