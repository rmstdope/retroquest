import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  VIRTUE_SELFLESS,
} from '../Act3StoryFlags'
import { QuietCharm } from '../items/QuietCharm'
import { AncientAmulet } from '../items/AncientAmulet'
import { Tobin } from './Tobin'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

const FIRST =
  '[character_name]Tobin[/character_name] looks at you for a long moment. His lips part, then close again. ' +
  'He turns the cracked lamp over in his hands and goes back to watching the ceiling.'
const SECOND =
  '[character_name]Tobin[/character_name] swallows, and you see what it costs him. No sound comes. He shakes his head, once.'
const THIRD =
  "[character_name]Tobin[/character_name] does not look up. His thumb traces the crack in the lamp's glass, back and forth."

describe('Tobin', () => {
  it('answers to tobin, young miner and boy, however cased', () => {
    const tobin = new Tobin()
    for (const name of ['tobin', 'Tobin', 'young miner', 'boy', 'BOY']) {
      expect(tobin.answersTo(name)).toBe(true)
    }
    expect(tobin.answersTo('miners')).toBe(false)
  })

  it('is described as a boy who watches the ceiling', () => {
    const game = new Game([new Act3()])
    const answer = new Tobin().examine(game.state)
    expect(answer).toContain(
      'A boy of perhaps fifteen sits apart from the others on an upturned bucket',
    )
    expect(answer).toContain('He watches the ceiling, not you.')
    expectMarkupWellFormed(answer)
  })

  it('answers only with silence, differently the first, second and third time', () => {
    const game = new Game([new Act3()])
    const tobin = new Tobin()
    const answers = [1, 2, 3, 4, 5].map(() => tobin.talkTo(game.state))
    expect(answers[0]).toContain(FIRST)
    expect(answers[1]).toContain(SECOND)
    expect(answers[2]).toContain(THIRD)
    expect(answers[3]).toBe(answers[2])
    expect(answers[4]).toBe(answers[2])
    for (const answer of answers) {
      expect(answer).not.toContain('[event]')
      expect(answer).not.toContain('[dialogue]')
      expectMarkupWellFormed(answer)
    }
  })

  it('is unchanged by the Dragon’s Memory', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    expect(new Tobin().talkTo(game.state)).toContain(FIRST)
  })

  describe('the quiet charm', () => {
    const setup = (): { game: Game; tobin: Tobin } => {
      const game = new Game([new Act3()])
      game.state.addItemToInventory(new QuietCharm())
      return { game, tobin: new Tobin() }
    }

    it('gives him his voice back, takes the charm and records one selfless moment', () => {
      const { game, tobin } = setup()
      const charm = game.state.inventory.find((i) => i.name === 'quiet charm')!
      const answer = tobin.giveItem(game.state, charm)

      expect(answer).not.toContain('You give the')
      expect(answer).toContain(
        'As his hand closes around it, the creak of the new braces seems to step back a pace',
      )
      expect(
        answer.startsWith(
          '[character_name]Tobin[/character_name] turns the pale stone',
        ),
      ).toBe(true)
      expect(answer).toContain("It's quiet.")
      expect(answer).toContain(
        'Across the gallery, the lead miner sets down his pick and does not pick it up again.',
      )
      expect(
        answer
          .trimEnd()
          .endsWith('[event]✦ Selflessness — this will be remembered[/event]'),
      ).toBe(true)
      expectMarkupWellFormed(answer)
      expect(game.state.inventory.some((i) => i.name === 'quiet charm')).toBe(
        false,
      )
      expect(game.state.virtueCount(VIRTUE_SELFLESS)).toBe(1)
    })

    it('shows the charm at his throat and speaks the same line every talk', () => {
      const { game, tobin } = setup()
      tobin.giveItem(
        game.state,
        game.state.inventory[game.state.inventory.length - 1],
      )
      expect(tobin.examine(game.state)).toContain(
        'The pale charm hangs at his throat on a bootlace',
      )
      const a = tobin.talkTo(game.state)
      expect(a).toContain("Still quiet. I'll keep it, if that's all right.")
      expect(tobin.talkTo(game.state)).toBe(a)
      expect(a).not.toContain('swallows')
      expectMarkupWellFormed(a)
    })

    it('works even before he has ever been talked to', () => {
      const { game, tobin } = setup()
      expect(tobin.talks).toBe(0)
      const answer = tobin.giveItem(game.state, new QuietCharm())
      expect(answer).toContain("It's quiet.")
    })

    it('declines anything else as usual', () => {
      const { game, tobin } = setup()
      const answer = tobin.giveItem(game.state, new AncientAmulet())
      expect(answer).toContain("doesn't seem interested")
      expect(game.state.virtueCount(VIRTUE_SELFLESS)).toBe(0)
    })
  })
})
