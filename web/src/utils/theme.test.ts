import { describe, it, expect } from 'vitest'
import { renderMarkup, escapeHtml, THEME_TAGS } from '@/utils/theme'

describe('theme', () => {
  describe('THEME_TAGS', () => {
    it('contains all expected tags', () => {
      const expected = [
        'character_name',
        'dialogue',
        'item_name',
        'spell_name',
        'room_name',
        'quest_name',
        'event',
        'failure',
        'success',
        'exits',
        'bold',
        'dim',
      ]
      expect(THEME_TAGS).toEqual(expected)
    })
  })

  describe('escapeHtml', () => {
    it('escapes ampersands', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B')
    })

    it('escapes angle brackets', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    })

    it('escapes double quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
    })

    it('escapes single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#039;s')
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

    it('converts character_name tag to span', () => {
      expect(renderMarkup('[character_name]Mira[/character_name]')).toBe(
        '<span class="theme-character_name">Mira</span>',
      )
    })

    it('converts dialogue tag', () => {
      expect(renderMarkup('[dialogue]Hello there![/dialogue]')).toBe(
        '<span class="theme-dialogue">Hello there!</span>',
      )
    })

    it('converts item_name tag', () => {
      expect(renderMarkup('[item_name]Sword[/item_name]')).toBe(
        '<span class="theme-item_name">Sword</span>',
      )
    })

    it('converts spell_name tag', () => {
      expect(renderMarkup('[spell_name]Fireball[/spell_name]')).toBe(
        '<span class="theme-spell_name">Fireball</span>',
      )
    })

    it('converts room_name tag', () => {
      expect(renderMarkup('[room_name]Village[/room_name]')).toBe(
        '<span class="theme-room_name">Village</span>',
      )
    })

    it('converts quest_name tag', () => {
      expect(renderMarkup('[quest_name]Find Key[/quest_name]')).toBe(
        '<span class="theme-quest_name">Find Key</span>',
      )
    })

    it('converts event tag', () => {
      expect(renderMarkup('[event]Something happened![/event]')).toBe(
        '<span class="theme-event">Something happened!</span>',
      )
    })

    it('converts failure tag', () => {
      expect(renderMarkup('[failure]You failed.[/failure]')).toBe(
        '<span class="theme-failure">You failed.</span>',
      )
    })

    it('converts success tag', () => {
      expect(renderMarkup('[success]You succeeded![/success]')).toBe(
        '<span class="theme-success">You succeeded!</span>',
      )
    })

    it('converts exits tag', () => {
      expect(renderMarkup('[exits]North, South[/exits]')).toBe(
        '<span class="theme-exits">North, South</span>',
      )
    })

    it('converts bold tag', () => {
      expect(renderMarkup('[bold]Important[/bold]')).toBe(
        '<span class="theme-bold">Important</span>',
      )
    })

    it('converts dim tag', () => {
      expect(renderMarkup('[dim]Faded text[/dim]')).toBe(
        '<span class="theme-dim">Faded text</span>',
      )
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
