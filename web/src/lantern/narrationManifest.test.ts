import { describe, expect, it } from 'vitest'
import { narrationKey } from './narrationKey'
import {
  findClip,
  narrationWords,
  type NarrationManifest,
} from './narrationManifest'

const manifest: NarrationManifest = {
  [narrationKey('mira', 'Come in, child.')]: {
    file: 'abc.mp3',
    speaker: 'mira',
    duration: 1.8,
    words: [
      { word: 'Come', start: 0.1, end: 0.4 },
      { word: 'in,', start: 0.4, end: 0.7 },
      { word: 'child.', start: 0.8, end: 1.5 },
    ],
  },
}

describe('findClip', () => {
  it('finds the recording for a shown block by its speaker and markup', () => {
    expect(
      findClip(manifest, 'Mira', '[dialogue]Come in, child.[/dialogue]')?.file,
    ).toBe('abc.mp3')
  })

  it('finds nothing for words that were never recorded', () => {
    expect(findClip(manifest, 'mira', 'You have 3 coins.')).toBeNull()
  })

  it('finds nothing for the same words in another voice', () => {
    expect(findClip(manifest, 'grandmother', 'Come in, child.')).toBeNull()
  })

  it('finds nothing for a block with no words', () => {
    expect(findClip(manifest, 'narrator', '[event][/event]')).toBeNull()
  })
})

describe('narrationWords', () => {
  it('gives the shown tokens the timings refer to, punctuation attached', () => {
    expect(
      narrationWords(
        'She stops when she sees [character_name]your[/character_name] face —  quiet.',
      ),
    ).toEqual([
      'She',
      'stops',
      'when',
      'she',
      'sees',
      'your',
      'face',
      '—',
      'quiet.',
    ])
  })

  it('is empty for a block with no words', () => {
    expect(narrationWords('  [bold][/bold] ')).toEqual([])
  })
})
