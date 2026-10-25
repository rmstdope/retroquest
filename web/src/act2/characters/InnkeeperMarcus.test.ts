import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act2 } from '../Act2'
import { Coins } from '../items/Coins'
import { InnkeeperMarcus } from './InnkeeperMarcus'
import {
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_MARCUS_TOLD_TRUTH,
  VIRTUE_TRUTH,
} from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const LODGER_LINE = 'Its last lodger was a man in a grey cloak.'
const ILL_WIND = 'An ill wind, the healer called it.'
const REMEMBERED = '✦ Truth — this will be remembered'

/** An Act II game at the Silver Stag Inn, Elena cured; the charm not yet given. */
function gameAfterCure(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.SilverStagInn
  game.state.setStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED, true)
  return game
}

describe('Innkeeper Marcus and the truth (truth moment)', () => {
  it('leaves the charm-giving talk unchanged', () => {
    const game = gameAfterCure()

    const answer = game.commandParser.parse('talk to innkeeper marcus')

    expect(answer).toContain('druidic charm')
    expect(answer).not.toContain(ILL_WIND)
  })

  it('ends every later talk with the ill wind line until told', () => {
    const game = gameAfterCure()
    game.commandParser.parse('talk to innkeeper marcus')

    for (let i = 0; i < 2; i++) {
      const answer = game.commandParser.parse('talk to innkeeper marcus')
      expect(answer).toContain('My daughter is healthy and happy again')
      expect(answer).toContain(ILL_WIND)
      expect(answer.indexOf(ILL_WIND)).toBeGreaterThan(
        answer.indexOf('My daughter is healthy'),
      )
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'innkeeper marcus')
    }
  })

  it('records truth with the telling, his reply and the remembered line', () => {
    const game = gameAfterCure()
    game.commandParser.parse('talk to innkeeper marcus')

    const answer = game.commandParser.parse('say truth to marcus')

    expect(answer).toContain('You tell')
    expect(answer).toContain('the curse was no ill wind')
    expect(answer).toContain(
      'On purpose. … Someone chose my girl. … Then this house sleeps with one ' +
        'eye open from now on. Thank you for telling me. ' +
        "I'd sooner know it than be comforted by a lie.",
    )
    expect(answer).toContain(REMEMBERED)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'innkeeper marcus')
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_MARCUS_TOLD_TRUTH)).toBe(true)
  })

  it('works between the cure and the charm talk', () => {
    const game = gameAfterCure()

    const answer = game.commandParser.parse('say truth to marcus')

    expect(answer).toContain(REMEMBERED)
  })

  it('records the moment although Act I already recorded truth', () => {
    const game = gameAfterCure()
    game.state.addVirtue(VIRTUE_TRUTH)

    expect(game.commandParser.parse('say truth to marcus')).toContain(
      REMEMBERED,
    )
  })

  it('drops the ill wind line after the truth and adds nothing', () => {
    const game = gameAfterCure()
    game.commandParser.parse('talk to innkeeper marcus')
    game.commandParser.parse('say truth to marcus')

    const answer = game.commandParser.parse('talk to innkeeper marcus')

    expect(answer).toContain('My daughter is healthy and happy again')
    expect(answer).not.toContain(ILL_WIND)
    expect(answer).not.toContain('remembered')
  })

  it('answers a second telling without a second remembered line', () => {
    const game = gameAfterCure()
    game.commandParser.parse('say truth to marcus')

    const answer = game.commandParser.parse('say truth to marcus')

    expect(answer).toContain('I heard you the first time, friend.')
    expect(answer).not.toContain('remembered')
    expectDialogueSpeaker(answer, 'innkeeper marcus')
  })

  it('says the truth is upstairs before the cure and records nothing', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn

    const answer = game.commandParser.parse('say truth to marcus')

    expect(answer).toContain('The only truth I care about is upstairs')
    expect(answer).not.toContain('remembered')
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(false)
    expectDialogueSpeaker(answer, 'innkeeper marcus')
  })

  it('gives other words the default reply', () => {
    const game = gameAfterCure()

    const answer = game.commandParser.parse('say hello to marcus')

    expect(answer).toContain("don't seem to understand")
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(false)
  })
})

describe('Innkeeper Marcus and the last lodger', () => {
  /** A game with enough coins to rent the room. */
  function richGame(coins: number): Game {
    const game = new Game([new Act2()])
    for (let i = 0; i < coins; i++) {
      game.state.addItemToInventory(new Coins())
    }
    return game
  }

  it('mentions the lodger once, after the purchase text', () => {
    const game = richGame(20)
    const text = new InnkeeperMarcus().buyItem(game.state, 'room key')

    expect(findMarkupProblems(text)).toEqual([])
    expect(text).toContain(LODGER_LINE)
    expectDialogueSpeaker(text, 'innkeeper marcus')
    expect(text).toContain('It was the week the king went.')
    expect(text.indexOf(LODGER_LINE)).toBeGreaterThan(
      text.indexOf('remaining.'),
    )
    expect(text.split(LODGER_LINE)).toHaveLength(2)
  })

  it('stays silent when the purchase is refused', () => {
    const poor = new InnkeeperMarcus().buyItem(richGame(0).state, 'room key')
    expect(poor).not.toContain(LODGER_LINE)

    const game = richGame(30)
    const marcus = new InnkeeperMarcus()
    marcus.buyItem(game.state, 'room key')
    expect(marcus.buyItem(game.state, 'room key')).not.toContain(LODGER_LINE)
  })

  it('says nothing about the lodger in ordinary talk', () => {
    expect(
      new InnkeeperMarcus().talkTo(new Game([new Act2()]).state),
    ).not.toContain('grey cloak')
  })
})

describe('Innkeeper Marcus and the week the king went', () => {
  const WEEK_LINE =
    'It came on her the week the king went. The whole town was out in the ' +
    'streets asking after him, and I was upstairs with a cold cloth.'
  const PLEA = "You've spoken with"

  /** An Act II game at the inn with Elena met but not cured. */
  function gameAfterElena(): Game {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)
    return game
  }

  it('follows the plea with the line, on every talk', () => {
    const game = gameAfterElena()

    for (let i = 0; i < 2; i++) {
      const text = game.commandParser.parse('talk to innkeeper marcus')
      expect(text).toContain(WEEK_LINE)
      expect(text.indexOf(WEEK_LINE)).toBeGreaterThan(text.indexOf(PLEA))
      expectMarkupWellFormed(text)
      expectDialogueSpeaker(text, 'innkeeper marcus')
    }
  })

  it('says nothing before meeting Elena', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn

    expect(game.commandParser.parse('talk to innkeeper marcus')).not.toContain(
      WEEK_LINE,
    )
  })

  it('says nothing after the cure', () => {
    const game = gameAfterCure()
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)

    for (let i = 0; i < 2; i++) {
      expect(
        game.commandParser.parse('talk to innkeeper marcus'),
      ).not.toContain(WEEK_LINE)
    }
  })
})

describe('Innkeeper Marcus introduced by name (rq-pcn)', () => {
  /**
   * What the story view shows as text around his quotes: the answer without
   * its `[dialogue]` blocks and without the `Name:` label lines, which the
   * view drops and shows, title-cased, as the label above the quote.
   */
  function narration(text: string): string {
    return text
      .replace(/\[dialogue\][\s\S]*?\[\/dialogue\]/g, '')
      .replace(/^\[character_name\][^[]+\[\/character_name\]:?\s*$/gm, '')
  }

  function expectIntroducedByName(text: string): void {
    expect(text).not.toContain('The [character_name]')
    expect(narration(text)).not.toContain('innkeeper marcus')
    expectDialogueSpeaker(text, 'innkeeper marcus')
  }

  it('before Elena is met', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn

    expectIntroducedByName(game.commandParser.parse('talk to innkeeper marcus'))
  })

  it('after Elena is met', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)

    expectIntroducedByName(game.commandParser.parse('talk to innkeeper marcus'))
  })

  it('after the cure, with and after the charm', () => {
    const game = gameAfterCure()

    expectIntroducedByName(game.commandParser.parse('talk to innkeeper marcus'))
    expectIntroducedByName(game.commandParser.parse('talk to innkeeper marcus'))
  })
})

describe('Innkeeper Marcus speaks every line in his quote (rq-31u)', () => {
  /**
   * Each of `lines` is shown inside a quote labelled with his name, and none
   * in a narration paragraph of the story view.
   */
  function expectQuoted(text: string, lines: string[]): void {
    const blocks = parseTurn(text)
    for (const line of lines) {
      const quote = blocks.find(
        (block) => block.kind === 'dialogue' && block.markup.includes(line),
      )
      expect(quote, `"${line}" not quoted in: ${text}`).toMatchObject({
        speaker: 'innkeeper marcus',
      })
      const narrated = blocks.filter(
        (block) => block.kind === 'text' && block.markup.includes(line),
      )
      expect(narrated, `"${line}" narrated in: ${text}`).toEqual([])
    }
  }

  it('before Elena is met', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn

    expectQuoted(game.commandParser.parse('talk to innkeeper marcus'), [
      'Welcome to The Silver Stag Inn!',
      'Though I must say, these have been dark times for my family.',
    ])
  })

  it('after Elena is met', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)

    expectQuoted(game.commandParser.parse('talk to innkeeper marcus'), [
      'Welcome to The Silver Stag Inn!',
      'Then you understand my desperation.',
      'It came on her the week the king went.',
    ])
  })

  it('after the cure, with the charm and after it', () => {
    const game = gameAfterCure()

    expectQuoted(game.commandParser.parse('talk to innkeeper marcus'), [
      'You have given me back my daughter!',
    ])
    expectQuoted(game.commandParser.parse('talk to innkeeper marcus'), [
      'My daughter is healthy and happy again',
      ILL_WIND,
    ])
  })
})
