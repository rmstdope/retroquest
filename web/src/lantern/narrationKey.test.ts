import { describe, expect, it } from 'vitest'
import { narrationKey, narrationText } from './narrationKey'

describe('narrationText', () => {
  it('strips markup and collapses whitespace', () => {
    expect(
      narrationText(
        '  You see [character_name]Mira[/character_name]\n by the  [item_name]well[/item_name]. ',
      ),
    ).toBe('You see Mira by the well.')
  })
})

describe('narrationKey', () => {
  it('is fourteen hex characters', () => {
    expect(narrationKey('narrator', 'A storm.')).toMatch(/^[0-9a-f]{14}$/)
  })

  it('ignores markup and spacing, so the shown block finds its recording', () => {
    expect(narrationKey('mira', '[dialogue]Come in,  child.[/dialogue]')).toBe(
      narrationKey('mira', 'Come in, child.'),
    )
  })

  it('ignores the case and padding of the speaker', () => {
    expect(narrationKey(' Mira ', 'Come in, child.')).toBe(
      narrationKey('mira', 'Come in, child.'),
    )
  })

  it('differs for another speaker of the same words', () => {
    expect(narrationKey('mira', 'Come in, child.')).not.toBe(
      narrationKey('grandmother', 'Come in, child.'),
    )
  })

  it('differs when the wording changes, so stale recordings are noticed', () => {
    expect(narrationKey('narrator', 'A storm.')).not.toBe(
      narrationKey('narrator', 'A storm!'),
    )
  })
})
