import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import { AshScholar } from './AshScholar'
import { BrassMirrorSegment } from '../items/BrassMirrorSegment'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** A minimal game state for character tests. */
function makeGameState(): GameState {
  return new Game([new Act3()]).state
}

describe('AshScholar', () => {
  it('gives a Brass Mirror Segment exactly once when none is carried', () => {
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
    expect(first).toContain('A notebook, burned nearly through.')
    expect(first).toContain('You receive the [item_name]Charred Notebook')
    expect(g.getItemCount('Charred Notebook')).toBe(1)
    expect(first.indexOf('Brass Mirror Segment')).toBeLessThan(
      first.indexOf('Charred Notebook'),
    )
    const later = scholar.talkTo(g)
    expect(later).toContain('Seek the outcrops for what the mountain has shed.')
    expect(later).not.toContain('alignment')
    expect(later).not.toContain('Notebook')
    expect(g.getItemCount('Charred Notebook')).toBe(1)
  })
})
