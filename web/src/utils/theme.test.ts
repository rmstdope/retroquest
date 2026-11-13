import { describe, it, expect } from 'vitest'
import { renderMarkup, escapeHtml } from '@/utils/theme'

describe('theme', () => {
  describe('escapeHtml', () => {
    it('escapes ampersands, brackets and both kinds of quote', () => {
      const cases: Array<[string, string]> = [
        ['A & B', 'A &amp; B'],
        ['<script>', '&lt;script&gt;'],
        ['"hello"', '&quot;hello&quot;'],
        ["it's", 'it&#039;s'],
      ]
      const wrong = cases.filter(([raw, out]) => escapeHtml(raw) !== out)
      expect(wrong).toEqual([])
    })

    it('handles multiple special characters', () => {
      expect(escapeHtml('<a href="x">&</a>')).toBe(
        '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;',
      )
    })

    it('returns unchanged string with no special chars', () => {
      expect(escapeHtml('hello world')).toBe('hello world')
    })
  })

  describe('renderMarkup', () => {
    it('returns empty string for empty input', () => {
      expect(renderMarkup('')).toBe('')
    })

    it('returns empty string for null-ish input', () => {
      expect(renderMarkup(undefined as unknown as string)).toBe('')
      expect(renderMarkup(null as unknown as string)).toBe('')
    })

    it('converts each theme tag to its span', () => {
      const tags = [
        'character_name',
        'dialogue',
        'item_name',
        'spell_name',
        'room_name',
        'quest_name',
        'event',
        'failure',
        'pending',
        'success',
        'exits',
        'bold',
        'italic',
        'breath',
        'dim',
      ]
      const wrong = tags.filter(
        (tag) =>
          renderMarkup(`[${tag}]Text[/${tag}]`) !==
          `<span class="theme-${tag}">Text</span>`,
      )
      expect(wrong).toEqual([])
    })

    it('handles multiple tags in one string', () => {
      const input =
        '[character_name]Mira[/character_name] says [dialogue]Hello[/dialogue]'
      const expected =
        '<span class="theme-character_name">Mira</span> says ' +
        '<span class="theme-dialogue">Hello</span>'
      expect(renderMarkup(input)).toBe(expected)
    })

    it('handles nested tags', () => {
      const input = '[bold][character_name]Mira[/character_name][/bold]'
      const expected =
        '<span class="theme-bold">' +
        '<span class="theme-character_name">Mira</span></span>'
      expect(renderMarkup(input)).toBe(expected)
    })

    it('converts newlines to <br>', () => {
      expect(renderMarkup('line1\nline2')).toBe('line1<br>line2')
    })

    it('escapes HTML before applying tags', () => {
      const input = '[bold]<script>alert("xss")</script>[/bold]'
      const expected =
        '<span class="theme-bold">' +
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</span>'
      expect(renderMarkup(input)).toBe(expected)
    })

    it('leaves unknown tags as escaped text', () => {
      expect(renderMarkup('[unknown]text[/unknown]')).toBe(
        '[unknown]text[/unknown]',
      )
    })

    it('handles multiple occurrences of the same tag', () => {
      const input = '[bold]first[/bold] and [bold]second[/bold]'
      const expected =
        '<span class="theme-bold">first</span> and ' +
        '<span class="theme-bold">second</span>'
      expect(renderMarkup(input)).toBe(expected)
    })

    it('handles plain text with no tags', () => {
      expect(renderMarkup('Just plain text.')).toBe('Just plain text.')
    })
  })
})
