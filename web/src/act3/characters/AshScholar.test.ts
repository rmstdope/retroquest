import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import { AshScholar } from './AshScholar'
import { BrassMirrorSegment } from '../items/BrassMirrorSegment'
import {
  FLAG_ACT3_MIRRORS_MENDED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
} from '../Act3StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** A minimal game state for character tests. */
function makeGameState(): GameState {
  return new Game([new Act3()]).state
}

describe('AshScholar', () => {
  it('is described by what he carries, not as thoughtful', () => {
    expect(new AshScholar().description).toBe(
      'A scholar in soot-streaked robes, with a sheaf of notes on mirror ' +
        'angles tied to one wrist so the wind cannot take it.',
    )
  })

  it('gives a brass mirror segment exactly once when none is carried', () => {
    const g = makeGameState()
    const scholar = new AshScholar()
    expect(g.getItemCount('Brass Mirror Segment')).toBe(0)

    const res1 = scholar.talkTo(g)
    expect(
      res1.toLowerCase().includes('brass') ||
        res1.toLowerCase().includes('scrap'),
    ).toBe(true)
    expect(g.getItemCount('Brass Mirror Segment')).toBe(1)

    const res2 = scholar.talkTo(g)
    expect(
      res2.toLowerCase().includes('terraces') ||
        res2.toLowerCase().includes('seek'),
    ).toBe(true)
    expect(g.getItemCount('Brass Mirror Segment')).toBe(1)
  })

  it('still gives one segment, only once, when the player already has one', () => {
    const g = makeGameState()
    const scholar = new AshScholar()
    g.addItemToInventory(new BrassMirrorSegment())
    expect(g.getItemCount('Brass Mirror Segment')).toBe(1)

    const res1 = scholar.talkTo(g)
    expect(
      res1.toLowerCase().includes('brass') ||
        res1.toLowerCase().includes('scrap'),
    ).toBe(true)
    expect(g.getItemCount('Brass Mirror Segment')).toBe(2)

    const res2 = scholar.talkTo(g)
    expect(
      res2.toLowerCase().includes('terraces') ||
        res2.toLowerCase().includes('seek'),
    ).toBe(true)
    expect(g.getItemCount('Brass Mirror Segment')).toBe(2)
  })

  it('attributes the dialogue on both visits', () => {
    const g = makeGameState()
    const scholar = new AshScholar()
    const answers = [scholar.talkTo(g), scholar.talkTo(g)]

    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, scholar.name)
    }
  })
})

describe('AshScholar notebook', () => {
  it('hands out the notebook with the segment on the first talk, once', () => {
    const g = makeGameState()
    const scholar = new AshScholar()
    const first = scholar.talkTo(g)
    for (const line of [
      'We are on an expedition: a small band of scholars and tinkerers, tracing the terraces and cataloguing anything that glints.',
      'I found this brass mirror segment while prying at a collapsed ledge. It is small, but it will mend a mount. There will be more among the outcrops, if you search carefully.',
      'This was in the same ledge. A notebook, burned nearly through. Whoever wrote in it knew these mirrors better than any of us, and I cannot make out who that was. Perhaps you can.',
    ]) {
      expect(first).toContain(line)
    }
    expect(first).toContain(
      'You receive a [item_name]brass mirror segment[/item_name].',
    )
    expect(first).toContain(
      'You receive a [item_name]charred notebook[/item_name].',
    )
    expect(first).toContain(
      'looks up from a tray of brass fittings and wipes the soot from both ' +
        'hands before speaking.',
    )
    expect(first).not.toContain('studies you')
    expect(g.getItemCount('Charred Notebook')).toBe(1)
    expect(
      first.indexOf('[item_name]brass mirror segment[/item_name].'),
    ).toBeLessThan(first.indexOf('[item_name]charred notebook[/item_name].'))
    const later = scholar.talkTo(g)
    expect(later).toContain(
      'taps a page of notes. [dialogue]The mount on the terraces takes four ' +
        'segments, by my notes.',
    )
    expect(later).toContain('Seek the outcrops for what the mountain has shed.')
    expect(later).not.toContain('alignment')
    expect(later).not.toContain('Notebook')
    expect(g.getItemCount('Charred Notebook')).toBe(1)
  })
})

describe('AshScholar after the mirrors', () => {
  /** A state where the scholar has given his gifts already. */
  function afterGifts(): { g: GameState; scholar: AshScholar } {
    const g = makeGameState()
    const scholar = new AshScholar()
    scholar.talkTo(g)
    return { g, scholar }
  }

  it('stops counting segments once the mirrors are mended', () => {
    const { g, scholar } = afterGifts()
    g.setStoryFlag(FLAG_ACT3_MIRRORS_MENDED, true)
    const answer = scholar.talkTo(g)
    expectMarkupWellFormed(answer)
    expect(answer).not.toContain('takes four segments')
    expect(answer).toContain(
      'The mirror on the terraces is burning again; I saw it catch from here.',
    )
  })

  it('speaks of the feather once it is won', () => {
    const { g, scholar } = afterGifts()
    g.setStoryFlag(FLAG_ACT3_MIRRORS_MENDED, true)
    g.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    const answer = scholar.talkTo(g)
    expectMarkupWellFormed(answer)
    expect(answer).not.toContain('takes four segments')
    expect(answer).toContain(
      'We have catalogued everything on this mountain that glints, and ' +
        'never that.',
    )
  })
})
