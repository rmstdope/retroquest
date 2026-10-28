import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { SilenceKeeper } from './SilenceKeeper'
import { EchoStones } from '../items/EchoStones'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_ECHO_HEARD,
  FLAG_ACT3_KEEPER_PHANTOM_LINE_TOLD,
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_PHANTOMS_FREED,
  FLAG_ACT3_POOLS_STILLED,
} from '../Act3StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectStoryFlag,
} from '@/testing/gameHelpers'

describe('Silence Keeper dialogue markup', () => {
  it('attributes the guidance to the keeper before the first dialogue', () => {
    const game = new Game([new Act3()])
    const keeper = new SilenceKeeper()

    const answer = keeper.talkTo(game.state)

    expect(answer).toContain('I have kept this hush for forty years')
    expect(answer).toContain('I was a singer once, in the villages above.')
    expect(answer).toContain('Bless them, and give them the old chant')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, keeper.name)
  })
})

describe('Silence Keeper over time', () => {
  it('tells the story once, then reminds, then closes once the way is open', () => {
    const game = new Game([new Act3()])
    const keeper = new SilenceKeeper()

    const first = keeper.talkTo(game.state)
    const later = keeper.talkTo(game.state)
    expect(keeper.talkTo(game.state)).toBe(later)
    expect(later).toContain('Forty years I have listened to those stones.')
    expect(later).not.toContain('singer')

    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
    const opened = keeper.talkTo(game.state)
    expect(opened).toContain(
      'The stones held. The way is open, and the sleeper knows you are ' +
        'coming. Go quietly.',
    )
    expect(opened).not.toContain('The sleeper spoke with you')

    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    const closing = keeper.talkTo(game.state)
    expect(closing).toContain('The sleeper spoke with you, and the stone held.')
    expect(keeper.talkTo(game.state)).toBe(closing)
    for (const text of [first, later, opened, closing]) {
      expectMarkupWellFormed(text)
      expectDialogueSpeaker(text, keeper.name)
    }
  })

  it('gives the closing line on a first talk after the Dragon\u2019s Memory', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    const closing = new SilenceKeeper().talkTo(game.state)
    expect(closing).toContain('never been so glad to have kept a quiet')
    expect(closing).not.toContain('The water lies true')
  })

  it('sends Elior on quietly between the chant and the Dragon\u2019s Memory', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
    expect(new SilenceKeeper().talkTo(game.state)).toContain('Go quietly.')
  })
})

describe('Silence Keeper and the pools', () => {
  it('warns of troubled water until the pools are stilled', () => {
    const hint =
      'But a chant will not carry over troubled water, and these pools are ' +
      'not as still as they seem.'
    const first = new SilenceKeeper()
    const game = new Game([new Act3()])
    expect(first.talkTo(game.state)).toContain(hint)
    expect(first.talkTo(game.state)).toContain(hint)
  })

  it('says the water lies true once the pools are stilled, and after the oath', () => {
    const trueWater = 'The water lies true now; it will hold your words.'
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_POOLS_STILLED, true)
    const keeper = new SilenceKeeper()
    const first = keeper.talkTo(game.state)
    expect(first).toContain(trueWater)
    expect(first).not.toContain('troubled water')
    expect(keeper.talkTo(game.state)).toContain(trueWater)
    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
    expect(keeper.talkTo(game.state)).not.toContain(trueWater)
  })
})

describe('Silence Keeper and the echo stones', () => {
  /** The echo stones of the Stillness Vestibule in this game. */
  function stonesOf(game: Game): EchoStones {
    const stones = game.state.allRooms.StillnessVestibule.items.find(
      (item) => item instanceof EchoStones,
    )
    if (!(stones instanceof EchoStones)) throw new Error('no echo stones')
    return stones
  }

  it('asks to bless the stones before the warning about the pools, and says where the chant is', () => {
    const game = new Game([new Act3()])
    const keeper = new SilenceKeeper()

    const first = keeper.talkTo(game.state)
    const later = keeper.talkTo(game.state)

    expect(first).toContain(
      'Bless them, and give them the old chant from the walls of the Echo ' +
        'Chambers, and the way will open.',
    )
    expect(first.indexOf('Bless them')).toBeLessThan(
      first.indexOf('troubled water'),
    )
    expect(later).toContain(
      'They are cold. Bless the stones; give them the chant.',
    )
    expect(later.indexOf('Bless the stones')).toBeLessThan(
      later.indexOf('troubled water'),
    )
  })

  it('says the stones are warm again once they are blessed', () => {
    const game = new Game([new Act3()])
    const keeper = new SilenceKeeper()
    keeper.talkTo(game.state)
    stonesOf(game).receiveSpell(game.state, 'bless')

    const later = keeper.talkTo(game.state)

    expect(later).toContain('They are warm again. Give them the chant.')
    expect(later).not.toContain('cold')
    expect(later).not.toContain('Bless')
    expectMarkupWellFormed(later)
  })

  it('is described by the hush they keep', () => {
    const keeper = new SilenceKeeper()
    expect(keeper.description).toContain('you have lowered your voice')
    expect(keeper.description).not.toContain('absorb')
  })
})

describe('Silence Keeper on the phantoms', () => {
  const PRESENT =
    'The figures by the pools? They are not ghosts, not as the villages tell it. They are moments. ' +
    'Someone cut at time, years ago, and what came loose drifts down here, saying the same thing over. ' +
    'Tell them to rest; most of them only want leave to stop.'
  const PAST =
    'The figures by the pools are gone, then. They were not ghosts, not as the villages tell it. They were moments. ' +
    'Someone cut at time, years ago, and what came loose drifted down here, saying the same thing over. ' +
    'You gave them leave to stop.'
  const REMINDER = 'Forty years I have listened to those stones.'

  function setup(): { game: Game; keeper: SilenceKeeper } {
    return { game: new Game([new Act3()]), keeper: new SilenceKeeper() }
  }

  it('says nothing of the phantoms when the echo is unheard', () => {
    const { game, keeper } = setup()
    keeper.talkTo(game.state)
    const later = keeper.talkTo(game.state)
    expect(later).toContain(REMINDER)
    expect(later).not.toContain('moments')
  })

  it('keeps the first talk unchanged and adds the line on the second, once', () => {
    const { game, keeper } = setup()
    game.state.setStoryFlag(FLAG_ACT3_ECHO_HEARD, true)

    const first = keeper.talkTo(game.state)
    expect(first).toContain('singer once')
    expect(first).not.toContain('moments')

    const second = keeper.talkTo(game.state)
    expect(second).toContain(REMINDER)
    expect(second).toContain(PRESENT)
    expectMarkupWellFormed(second)
    expectStoryFlag(game.state, FLAG_ACT3_KEEPER_PHANTOM_LINE_TOLD, true)

    const third = keeper.talkTo(game.state)
    expect(third).toContain(REMINDER)
    expect(third).not.toContain('moments')
  })

  it('appends the line to a met keeper after the echo is heard', () => {
    const { game, keeper } = setup()
    keeper.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_ECHO_HEARD, true)
    expect(keeper.talkTo(game.state)).toContain(PRESENT)
  })

  it('tells the past-tense version when the phantoms were freed', () => {
    const { game, keeper } = setup()
    keeper.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_ECHO_HEARD, true)
    game.state.setStoryFlag(FLAG_ACT3_PHANTOMS_FREED, true)
    const answer = keeper.talkTo(game.state)
    expect(answer).toContain(PAST)
    expect(answer).not.toContain(PRESENT)
  })

  it('appends the line after the closing on the next talk once the Oath is complete', () => {
    const { game, keeper } = setup()
    game.state.setStoryFlag(FLAG_ACT3_ECHO_HEARD, true)
    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    const unchanged = keeper.talkTo(game.state)
    expect(unchanged).not.toContain('moments')
    const answer = keeper.talkTo(game.state)
    expect(answer).toContain('The sleeper spoke with you')
    expect(answer.indexOf(PRESENT)).toBeGreaterThan(
      answer.indexOf('The sleeper spoke with you'),
    )
    expect(keeper.talkTo(game.state)).not.toContain('moments')
  })

  it('says nothing more when the phantoms are freed after the line was told', () => {
    const { game, keeper } = setup()
    keeper.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_ECHO_HEARD, true)
    keeper.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_PHANTOMS_FREED, true)
    expect(keeper.talkTo(game.state)).not.toContain('moments')
  })
})
