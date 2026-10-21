import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { Banners } from './Banners'
import { CrystalWhispers } from './CrystalWhispers'
import { FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED } from '../Act4StoryFlags'

describe('Banners', () => {
  it('answers to banner and banners and cannot be carried', () => {
    const banners = new Banners()
    expect(banners.answersTo('banner')).toBe(true)
    expect(banners.answersTo('Banners')).toBe(true)
    expect(banners.canBeCarried).toBe(false)
  })

  it('reads as agreed', () => {
    const game = new Game([new Act4()])
    expect(new Banners().examine(game.state)).toBe(
      '[event]Tattered banners hang high along the walls, too grimed with age to read. Something is stitched beneath the dirt.[/event]',
    )
  })
})

describe('CrystalWhispers', () => {
  it('answers to whisper, whispers and crystals and cannot be carried', () => {
    const whispers = new CrystalWhispers()
    for (const name of ['whisper', 'whispers', 'crystals'])
      expect(whispers.answersTo(name)).toBe(true)
    expect(whispers.canBeCarried).toBe(false)
  })

  it('falls silent once the Sorceress is redeemed', () => {
    const game = new Game([new Act4()])
    const whispers = new CrystalWhispers()
    expect(whispers.examine(game.state)).toContain('You lean close')
    game.state.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED, true)
    expect(whispers.examine(game.state)).toBe(
      '[event]The crystals are silent now.[/event]',
    )
  })
})
