import { describe, it, expect } from 'vitest'
import { Game, Item } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_WARDEN_ASKED,
  FLAG_ACT3_WARDEN_TRUTH_TOLD,
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
} from '../Act3StoryFlags'
import { PierWarden } from './PierWarden'
import { WeatheredCoin } from '../items/WeatheredCoin'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('PierWarden dialogue branches', () => {
  it('hints at shore markers before the sigils are completed', () => {
    const game = new Game([new Act3()])

    const out = new PierWarden().talkTo(game.state)

    expect(out).toContain(
      "The markers along the shore, lad. There's bits of moon-sign broken " +
        'off in among them, if you look close.',
    )
    expect(out).not.toContain('before the tide turns')
  })

  it('points at a light by the causeway mural for the lost key', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)

    const out = new PierWarden().talkTo(game.state)

    expect(out).toContain(
      'It wants both. Lost that key after, in some dark hole by the mural ' +
        "on the causeway. You'd want a light to find it.",
    )
  })

  it('describes an old man watching the water', () => {
    expect(new PierWarden().description).toBe(
      'An old man in a salt-stiff coat, sitting on the last sound plank of ' +
        'the jetty with his eyes on the water.',
    )
  })

  it('mentions the fused locker after the sigils but before the lanterns', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)

    const out = new PierWarden().talkTo(game.state).toLowerCase()

    expect(out.includes('fused') || out.includes('locker')).toBe(true)
    expect(out.includes('stuck') || out.includes('magic')).toBe(true)
  })

  it('says key and magic are each useless alone, without the order', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)

    const out = new PierWarden().talkTo(game.state)

    expect(out).toContain(
      "I tried a key once but it stuck. Key's no good alone, and magic's " +
        'no good alone. It wants both.',
    )
    expect(out).not.toContain('old songs')
  })

  it('praises the lit way when both tasks are done', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)

    const out = new PierWarden().talkTo(game.state)

    expect(out).toContain(
      "Pillars set and lanterns lit. That's the sanctum open, then.",
    )
    expect(out).not.toContain('swallow their steps')
  })

  it("passes on his father's word about the sanctum water once the way is lit", () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    const hint =
      'My da walked that water once, when the old wardens still asked it ' +
      'of folk. Said the trick was not to leave yourself behind in the ' +
      'dark. I never did understand him.'

    expect(new PierWarden().talkTo(game.state)).toContain(hint)
    const early = new Game([new Act3()])
    expect(new PierWarden().talkTo(early.state)).not.toContain(hint)
  })

  it('attributes the dialogue to the warden in every state', () => {
    const game = new Game([new Act3()])
    const warden = new PierWarden()
    const answers = [warden.talkTo(game.state)]
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    answers.push(warden.talkTo(game.state))
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    answers.push(warden.talkTo(game.state))

    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, warden.name)
    }
  })
})

describe('PierWarden and the weathered coin', () => {
  it('keeps the coin, its new description and the follow-up across a save', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD, true)
    const coin = new WeatheredCoin()
    game.state.inventory.push(coin)
    new PierWarden().giveItem(game.state, coin)

    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const kept = fresh.state.inventory.find((i) => i.name === 'Weathered Coin')
    expect(kept).toBeInstanceOf(WeatheredCoin)
    expect(kept?.description).toContain('would not take it')
    expect(
      new PierWarden().giveItem(fresh.state, kept ?? new WeatheredCoin()),
    ).toContain('I said keep it, lad.')
  })

  it('is not interested in the coin before the truth is told', () => {
    const game = new Game([new Act3()])
    const coin = new WeatheredCoin()
    const description = coin.description

    expect(new PierWarden().giveItem(game.state, coin)).toContain(
      "doesn't seem interested",
    )
    game.state.setStoryFlag(FLAG_ACT3_WARDEN_ASKED, true)
    expect(new PierWarden().giveItem(game.state, coin)).toContain(
      "doesn't seem interested",
    )
    expect(coin.description).toBe(description)
  })

  it('presses the coin back the first time after the truth', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD, true)
    const coin = new WeatheredCoin()

    const out = new PierWarden().giveItem(game.state, coin)

    expect(out).not.toContain('You offer the')
    expect(out).not.toContain('[event]')
    expect(out).toContain(
      'turns the coin over once, then folds your fingers back around it.',
    )
    expect(out).toContain('Keep it. Toll for the crossing, my da said.')
    expect(coin.description).toBe(
      'A small, greened coin whose face has long since been worn away. ' +
        'The Pier Warden would not take it. Toll for the crossing, his da said.',
    )
    expectMarkupWellFormed(out)
    expectDialogueSpeaker(out, 'Pier Warden')
  })

  it('gives a short follow-up on every later offer', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD, true)
    const coin = new WeatheredCoin()
    const warden = new PierWarden()
    warden.giveItem(game.state, coin)

    for (let i = 0; i < 2; i++) {
      const out = warden.giveItem(game.state, coin)
      expect(out).toContain('pushes your hand away.')
      expect(out).not.toContain('[event]')
      expect(out).toContain('I said keep it, lad.')
      expect(out).not.toContain('Toll for the crossing, my da said.')
    }
  })

  it('still ignores other items after the truth', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD, true)

    const out = new PierWarden().giveItem(
      game.state,
      new Item({ name: 'Rusty Key', description: 'x' }),
    )

    expect(out).toContain("doesn't seem interested")
  })
})

describe('PierWarden hears the word as the engine does', () => {
  it('accepts a quoted, punctuated "Truth." as the word', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_WARDEN_ASKED, true)

    new PierWarden().sayTo(game.state, '"Truth."')

    expect(game.state.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)).toBe(true)
  })

  it.each([
    'the truth',
    'no',
    "it won't mend",
    'it will not',
    'No, it is not a season',
  ])('takes the natural answer %s as the truth', (words) => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_WARDEN_ASKED, true)

    const out = new PierWarden().sayTo(game.state, words)

    expect(game.state.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)).toBe(true)
    expect(out).toContain(
      "… Aye. I think I knew it. I only wanted someone to tell me otherwise. I'll " +
        'send word up the coast to keep the boats in.',
    )
    expect(out).not.toContain('Better a hard truth')
  })

  it.each(["I'm not sure", 'I do not know', 'no idea'])(
    'does not take the unsure answer %s as the truth',
    (words) => {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_WARDEN_ASKED, true)

      new PierWarden().sayTo(game.state, words)

      expect(game.state.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)).toBe(false)
    },
  )

  it.each(['yes, no doubt it will mend', 'it will mend, not to worry'])(
    'takes %s as the comforting lie, not the truth',
    (words) => {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_WARDEN_ASKED, true)

      const out = new PierWarden().sayTo(game.state, words)

      expect(out).toContain("That's what I'll tell the boats, then.")
      expect(game.state.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)).toBe(false)
    },
  )

  it.each(['yes', 'it will mend', 'It will pass', 'only a bad season'])(
    'takes the comforting lie %s and records nothing',
    (words) => {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_WARDEN_ASKED, true)
      const warden = new PierWarden()

      const out = warden.sayTo(game.state, words)

      expect(out).toContain(
        "Aye. That's what I'll tell the boats, then.[/dialogue] He goes back " +
          'to watching the water.',
      )
      expect(game.state.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)).toBe(false)
      expectMarkupWellFormed(out)
      expectDialogueSpeaker(out, warden.name)
      warden.sayTo(game.state, 'truth')
      expect(game.state.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)).toBe(true)
    },
  )

  it('does not hear the lie before he has asked', () => {
    const game = new Game([new Act3()])

    expect(new PierWarden().sayTo(game.state, 'yes')).not.toContain(
      "That's what I'll tell the boats",
    )
  })
})
