import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_DEMONSTRATED_COMBAT_SKILLS } from '../Act2StoryFlags'
import { MountainHermit } from './MountainHermit'
import {
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const PROPHETIC = /ancient eyes|sense great changes|look of one who might rise/

describe('MountainHermit, the retired sergeant', () => {
  it('is described as a castle sergeant', () => {
    const hermit = new MountainHermit()

    expect(hermit.description).toContain('patched grey castle cloak')
    expect(hermit.description).toContain('the way a sentry watches a gate')
    expect(hermit.description).not.toMatch(PROPHETIC)
  })

  it('names Cedric and hands over his blade on the first talk', () => {
    const game = new Game([new Act2()])
    const hermit = new MountainHermit()

    const first = hermit.talkTo(game.state)

    expect(first).toContain('the way he might inspect a recruit')
    expect(first).toContain('Thirty years I drilled squires')
    expect(first).toContain('He unwraps a battered')
    expect(first).toContain('This was [character_name]Cedric[/character_name]')
    expect(first).toContain(
      'Tell him the sergeant never believed a word of it.',
    )
    expect(first).toContain('They say he left his post the night the king went')
    expect(first).not.toContain('slept on watch')
    expect(first).toContain(
      'You receive a [item_name]training sword[/item_name].',
    )
    expect(first).not.toMatch(PROPHETIC)
    expect(game.state.inventory.map((i) => i.name)).toContain('training sword')
    expectMarkupWellFormed(first)
    expectNoSpeechOutsideDialogue(first)
  })

  it('reminds the player to deliver the message before the courtyard', () => {
    const game = new Game([new Act2()])
    const hermit = new MountainHermit()
    hermit.talkTo(game.state)

    const later = hermit.talkTo(game.state)

    expect(later).toContain("You've still got that blade, I see.")
    expect(later).toContain('mind you give him my words')
    expectMarkupWellFormed(later)
  })

  it('closes his thread once Cedric has recognised the sword', () => {
    const game = new Game([new Act2()])
    const hermit = new MountainHermit()
    hermit.talkTo(game.state)
    game.state.setStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS, true)

    for (let i = 0; i < 2; i++) {
      const later = hermit.talkTo(game.state)
      expect(later).toContain('Knew the notch, did he?')
      expect(later).toContain('Greendale needs him more than I do.')
      expectMarkupWellFormed(later)
    }
  })

  it('uses the same hand-over when the sword is given another way', () => {
    const game = new Game([new Act2()])
    const hermit = new MountainHermit()

    const given = hermit.giveTrainingSword(game.state)

    expect(given).toContain('He unwraps a battered')
    expect(given).toContain('the sergeant never believed a word of it')
    expect(given).toContain('You receive a [item_name]training sword')
    expect(given).not.toContain('would-be heroes')
    expectMarkupWellFormed(given)
    expect(hermit.giveTrainingSword(game.state)).toContain(
      "You've got it already. Don't lose it before he sees it.",
    )
  })
})
