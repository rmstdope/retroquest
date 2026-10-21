import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { ForestSprites } from './ForestSprites'
import { FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED } from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Forest Sprites voice', () => {
  it("finishes each other's sentences on the first talk and offers the riddles", () => {
    const game = new Game([new Act2()])

    const answer = new ForestSprites().talkTo(game.state)

    expect(game.state.getStoryFlag(FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED)).toBe(
      true,
    )
    for (const fragment of [
      'A traveller—',
      '—with muddy boots—',
      '—wanting the deep paths.',
      'And the nymphs have riddles—',
      '—east of here—',
      "—if you're clever.",
    ]) {
      expect(answer).toContain(`[dialogue]${fragment}[/dialogue]`)
    }
    expect(answer).not.toMatch(/ancient|sacred|wisdom/i)
    expect(answer).not.toMatch(/light and a ward|unwarded/i)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'forest sprites')
  })

  it('says one shared line on any later talk', () => {
    const game = new Game([new Act2()])
    const sprites = new ForestSprites()
    sprites.talkTo(game.state)

    const answer = sprites.talkTo(game.state)

    for (const fragment of [
      'Back again—',
      '—did you forget?',
      'Nymphs are east—',
      '—with their riddles.',
    ]) {
      expect(answer).toContain(`[dialogue]${fragment}[/dialogue]`)
    }
    expect(answer).not.toMatch(/light and a ward|unwarded/i)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'forest sprites')
  })

  it('has a plain description and look-closer line', () => {
    const sprites = new ForestSprites()

    const answer = sprites.examine(new Game([new Act2()]).state)

    expect(sprites.description).toBe(
      'Motes of light no bigger than a thumbnail, each with wings like a ' +
        'split beech-nut husk. They never all hold still at once.',
    )
    expect(answer).toContain(
      'The longer you watch, the more it seems they are watching you back.',
    )
    expectMarkupWellFormed(answer)
  })
})
