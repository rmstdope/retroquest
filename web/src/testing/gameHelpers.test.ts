import { describe, it, expect } from 'vitest'
import { Act, Game, Item, Quest, Room } from '@/engine'
import {
  executeCommands,
  expectCurrentRoom,
  expectDialogueSpeaker,
  expectItemCountInInventory,
  expectItemInInventory,
  expectItemInRoom,
  expectMarkupWellFormed,
  expectNoSpeakerLabelInDialogue,
  expectNoSpeechOutsideDialogue,
  expectQuestCompleted,
  expectQuests,
  expectStoryFlag,
} from './gameHelpers'

/** An item whose examine text has an unclosed event tag. */
class BadlyTagged extends Item {
  constructor() {
    super({ name: 'scroll', description: 'd' })
  }

  /** Returns markup with an unclosed `[event]`. */
  override examine(): string {
    return '[event]You examine the scroll.\nIt is blank.'
  }
}

class StartsAtOnce extends Quest {
  constructor() {
    super({ name: 'Starts', description: 'd' })
  }

  override checkTrigger(): boolean {
    return true
  }

  override checkCompletion(state: { hasItem(name: string): boolean }): boolean {
    return state.hasItem('coin')
  }
}

function game(): Game {
  const hall = new Room({
    name: 'Hall',
    description: 'd',
    items: [new Item({ name: 'coin', description: 'd', canBeCarried: true })],
    exits: { north: 'Yard' },
  })
  const yard = new Room({
    name: 'Yard',
    description: 'd',
    exits: { south: 'Hall' },
  })
  const act = new Act({
    name: 'A',
    rooms: { Hall: hall, Yard: yard },
    quests: [new StartsAtOnce()],
    musicFile: '',
    musicInfo: '',
  })
  return new Game([act])
}

describe('executeCommands', () => {
  it('runs the commands, settles quests and joins the answers', () => {
    const g = game()
    const text = executeCommands(g, ['look', 'n'])
    expect(text).toContain('You take a look')
    expect(text).toContain('You move north')
    expectCurrentRoom(g.state, 'Yard')
    expectQuests(g.state, ['Starts'])
    executeCommands(g, ['s', 'take coin'])
    expectQuestCompleted(g.state, 'Starts')
    expectQuests(g.state, [])
    expectItemInInventory(g.state, 'Coin')
    expectItemCountInInventory(g.state, 'coin', 1)
    expectItemInRoom(g.state.currentRoom, 'coin', false)
    g.state.setStoryFlag('seen', true)
    expectStoryFlag(g.state, 'seen')
    expectStoryFlag(g.state, 'unseen', false)
  })

  it('fails on output with malformed markup, naming the command', () => {
    const g = game()
    g.state.currentRoom.items.push(new BadlyTagged())
    expect(() => executeCommands(g, ['examine scroll'])).toThrow(
      /examine scroll[\s\S]*unclosed \[event\]/,
    )
  })
})

describe('markup assertions', () => {
  it('accepts well-formed markup and attributed dialogue', () => {
    const text =
      "[character_name]Mira[/character_name] smiles. [dialogue]'Welcome.'[/dialogue]"
    expectMarkupWellFormed(text)
    expectDialogueSpeaker(text, 'mira')
    expectNoSpeakerLabelInDialogue(text)
    expectNoSpeechOutsideDialogue(text)
  })

  it('rejects unknown, unbalanced and nested tags', () => {
    expect(() => expectMarkupWellFormed('[weird]x[/weird]')).toThrow()
    expect(() => expectMarkupWellFormed('[bold]x')).toThrow()
    expect(() =>
      expectMarkupWellFormed('[bold][bold]x[/bold][/bold]'),
    ).toThrow()
  })

  it("skips Elior's own lines between another speaker's", () => {
    expectDialogueSpeaker(
      '[character_name]Elior[/character_name]\n[dialogue]Hi[/dialogue]\n' +
        '[character_name]Mira[/character_name]\n[dialogue]Hello[/dialogue]',
      'mira',
    )
  })

  it('rejects dialogue without or with the wrong speaker, labels and stray speech', () => {
    expect(() =>
      expectDialogueSpeaker("[dialogue]'Hi'[/dialogue]", 'mira'),
    ).toThrow()
    expect(() =>
      expectDialogueSpeaker(
        "[character_name]Tilda[/character_name] [dialogue]'Hi'[/dialogue]",
        'mira',
      ),
    ).toThrow()
    expect(() =>
      expectNoSpeakerLabelInDialogue(
        '[dialogue][character_name]Mira[/character_name]: hi[/dialogue]',
      ),
    ).toThrow()
    expect(() =>
      expectNoSpeechOutsideDialogue("She says 'Hello there'."),
    ).toThrow()
  })
})
