import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_HEALERS_APPRENTICE_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
} from '../Act2StoryFlags'
import { MasterHealerLyria } from './MasterHealerLyria'
import { CrystalFocus } from '../items/CrystalFocus'
import { HealingHerbs } from '../items/HealingHerbs'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'Master Healer Lyria'

/** An Act II game for Lyria's dialogue. */
function createGame(): Game {
  return new Game([new Act2()])
}

/** The answer is well formed and Lyria speaks every dialogue. */
function expectLyriaSpeaks(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

describe('Master Healer Lyria dialogue markup', () => {
  it('attributes the talk without offerings to Lyria', () => {
    const game = createGame()

    const answer = new MasterHealerLyria().talkTo(game.state)

    expect(answer).toContain('Welcome to my house of healing')
    expectLyriaSpeaks(answer)
  })

  it('attributes the talk with the crystal focus to Lyria', () => {
    const game = createGame()
    game.state.addItemToInventory(new CrystalFocus())

    const answer = new MasterHealerLyria().talkTo(game.state)

    expect(answer).toContain('That crystal focus!')
    expectLyriaSpeaks(answer)
  })

  it('asks for the crystal focus when the player has healing herbs', () => {
    const game = createGame()
    game.state.addItemToInventory(new HealingHerbs())

    const answer = new MasterHealerLyria().talkTo(game.state)

    expect(answer).toContain('Crystal Focus')
    expect(answer).not.toContain('Healing Herbs')
    expectLyriaSpeaks(answer)
  })

  it('attributes the talks during and after the apprenticeship to Lyria', () => {
    const game = createGame()
    const lyria = new MasterHealerLyria()
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED, true)
    const inProgress = lyria.talkTo(game.state)
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true)

    const completed = lyria.talkTo(game.state)

    expect(inProgress).toContain('looking forward to teaching you')
    expect(completed).toContain('truly a master of the healing arts')
    for (const answer of [inProgress, completed]) {
      expectLyriaSpeaks(answer)
    }
  })

  it('attributes giving the crystal focus to Lyria', () => {
    const game = createGame()
    const focus = new CrystalFocus()
    game.state.addItemToInventory(focus)

    const answer = new MasterHealerLyria().giveItem(game.state, focus)

    expect(answer).toContain('This is exactly what I needed!')
    expectLyriaSpeaks(answer)
  })

  it('does not accept healing herbs as an apprenticeship offering', () => {
    const game = createGame()
    const herbs = new HealingHerbs()
    game.state.addItemToInventory(herbs)

    const answer = new MasterHealerLyria().giveItem(game.state, herbs)

    expect(answer).toContain('too busy to receive any gifts')
    expect(game.state.hasSpell('greater_heal')).toBe(false)
    expect(game.state.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)).toBe(
      false,
    )
    expect(game.state.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)).toBe(
      false,
    )
    expectMarkupWellFormed(answer)
    expect(answer).toContain(SPEAKER)
  })

  it('activates and completes the apprenticeship when given the crystal focus', () => {
    const game = createGame()
    const focus = new CrystalFocus()
    game.state.addItemToInventory(focus)

    new MasterHealerLyria().giveItem(game.state, focus)

    expect(game.state.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)).toBe(
      true,
    )
    expect(game.state.hasSpell('greater_heal')).toBe(true)
  })
})
