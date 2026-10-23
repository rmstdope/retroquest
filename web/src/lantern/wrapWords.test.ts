import { describe, expect, it } from 'vitest'
import { narrationWords } from './narrationManifest'
import { wrapWords } from './wrapWords'
import { renderMarkup } from '@/utils/theme'

describe('wrapWords', () => {
  it('wraps every whitespace-separated word with its index', () => {
    expect(wrapWords('Rain, and wind.')).toEqual({
      html:
        '<span class="lq-w" data-w="0">Rain,</span> ' +
        '<span class="lq-w" data-w="1">and</span> ' +
        '<span class="lq-w" data-w="2">wind.</span>',
      count: 3,
    })
  })

  it('keeps tags in place and counts a word that spans a tag once', () => {
    const { html, count } = wrapWords('a <span class="x">fo</span>o b<br>c')
    expect(count).toBe(4)
    expect(html).toContain('<span class="x"><span class="lq-w" data-w="1">fo')
    expect(html).toContain('<span class="lq-w" data-w="1">o</span>')
    expect(html).toContain('<br><span class="lq-w" data-w="3">c</span>')
  })

  it('agrees with the words the recordings were timed against', () => {
    const markup =
      'You find the [item_name]rusty key[/item_name], Elior—and a\nsmall [character_name]Mira[/character_name]: “hello.”'
    expect(wrapWords(renderMarkup(markup)).count).toBe(
      narrationWords(markup).length,
    )
  })

  it('numbers from a given start, for a unit whose text follows a heading', () => {
    expect(wrapWords('a b', 3)).toEqual({
      html: '<span class="lq-w" data-w="3">a</span> <span class="lq-w" data-w="4">b</span>',
      count: 2,
    })
  })

  it('has nothing to wrap in empty html', () => {
    expect(wrapWords('')).toEqual({ html: '', count: 0 })
  })
})
