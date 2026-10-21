/** Sir Cedric recognises the Wardens' sigil on Elior's amulet (rq-roe.2). */
import { describe, it, expect } from 'vitest'
import { Game, Quest } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { parseTurn } from '@/lantern/parseTurn'
import { Act2 } from '../Act2'
import {
  FLAG_CEDRIC_RECOGNISED_SIGIL,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
} from '../Act2StoryFlags'
import { AncientAmulet } from '../items/AncientAmulet'
import { NaturesCharm } from '../items/NaturesCharm'

const OLD_EXAMINE =
  'A mysterious amulet inscribed with runes. At its centre is a worn sigil ' +
  'you cannot place. It is faintly warm in your hand.'
const NEW_EXAMINE =
  'A mysterious amulet inscribed with runes. At its centre is the sigil of ' +
  'the Wardens of the Dawn: the sun rising over three linked rings. It is ' +
  'faintly warm in your hand.'
const OLD_GREETING =
  'Greetings, traveler. I am [character_name]Cedric[/character_name]. Some ' +
  "here still call me Sir; you need not. The Lord Commander's notice asks " +
  'for able hands; I ask for mine here in the yard, where I can see what ' +
  'they can do. I have been seeking individuals of courage and skill for a matter of ' +
  "great importance. Dark forces are gathering; I call it the 'Gathering " +
  "Storm', and I need allies with magical knowledge and proven abilities. " +
  'Before I can trust you with this responsibility, I need proof of your ' +
  'combat skills. Can you demonstrate your martial abilities?'
const STAGE_LINE =
  "Sir Cedric's eyes fall on the Ancient Amulet at your chest, and he goes " +
  'very still.'
const SIGIL_WORDS =
  'That sigil. The sun rising over three linked rings. I have seen it only ' +
  'in the old histories in the castle archive: it is the mark of the ' +
  'Wardens of the Dawn. They guarded this kingdom long ago, and most have ' +
  'forgotten them.'
const BOUND_WORDS =
  'Whoever wore that amulet before you was a Warden, and your family is ' +
  'bound to them. I know no more than that. But I know enough to listen to ' +
  'you.'

/** A new Act II game with Elior standing in the courtyard beside Cedric. */
function newGame(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.CastleCourtyard
  return game
}

/** Drop the amulet in the current room. */
function dropAmulet(game: Game): void {
  executeCommands(game, ['drop amulet'])
}

/** The amulet, wherever it is: the bag or the current room. */
function amuletOf(game: Game): AncientAmulet {
  const all = [...game.state.inventory, ...game.state.currentRoom.items]
  const amulet = all.find((i): i is AncientAmulet => i instanceof AncientAmulet)
  if (!amulet) throw new Error('no amulet')
  return amulet
}

/** The text with every markup tag removed. */
function plain(raw: string): string {
  return raw.replace(/\[\/?[a-z_]+\]/g, '')
}

describe('Sir Cedric and the sigil', () => {
  it('breaks off mid-greeting on the first talk with the amulet', () => {
    const game = newGame()
    const out = executeCommands(game, ['talk to sir cedric'])
    const text = plain(out)
    expect(text).toContain(
      'I have been seeking individuals of courage and skill for a matter of ' +
        'great—',
    )
    expect(text).toContain(
      'Sir Cedric stops mid-sentence. His eyes have fallen on the Ancient ' +
        'Amulet at your chest.',
    )
    expect(text).toContain(SIGIL_WORDS + '\n\n' + BOUND_WORDS)
    expect(text).toContain(
      "Dark forces are gathering; I call it the 'Gathering Storm', and I " +
        'need allies with magical knowledge and proven abilities. The sigil ' +
        'tells me where you come from; it does not tell me what you can do. ' +
        'Can you demonstrate your martial abilities?',
    )
    expect(text).not.toContain('proof of your combat skills')
    const order = [
      'matter of great—',
      'stops mid-sentence',
      SIGIL_WORDS,
      BOUND_WORDS,
      'Gathering Storm',
    ].map((piece) => text.indexOf(piece))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(parseTurn(out).map((b) => b.kind)).toEqual([
      'dialogue',
      'text',
      'dialogue',
    ])
    const last = parseTurn(out)[2]
    expect('markup' in last && last.markup).toContain(
      SIGIL_WORDS + '\n\n' + BOUND_WORDS,
    )
    expect(out).toContain('[item_name]Ancient Amulet[/item_name]')
    expect(game.state.getStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL)).toBe(true)
  })

  it('keeps Wardens of the Dawn plain text and the speech in one quote', () => {
    const out = executeCommands(newGame(), ['talk to sir cedric'])
    expect(out).toContain('Wardens of the Dawn')
    expect(out).not.toMatch(/\[[a-z_]+\]Wardens of the Dawn/)
    const quotes = parseTurn(out).filter((b) => b.kind === 'dialogue')
    expect(quotes.length).toBeGreaterThan(0)
    expect(quotes.every((q) => q.speaker === 'Sir Cedric')).toBe(true)
  })

  it('gives today’s greeting when the amulet is not carried', () => {
    const game = newGame()
    dropAmulet(game)
    const out = executeCommands(game, ['talk to sir cedric'])
    expect(out).toContain(OLD_GREETING)
    expect(out).not.toContain('Wardens')
    expect(game.state.getStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL)).toBe(false)
  })

  it('recognises on a later talk, then gives the normal reply unchanged', () => {
    const game = newGame()
    dropAmulet(game)
    executeCommands(game, ['talk to sir cedric'])
    executeCommands(game, ['take amulet'])
    const out = executeCommands(game, ['talk to sir cedric'])
    const text = plain(out)
    expect(text).toContain(STAGE_LINE)
    expect(text).toContain(SIGIL_WORDS + '\n\n' + BOUND_WORDS)
    expect(text.indexOf(BOUND_WORDS)).toBeLessThan(
      text.indexOf('I await your demonstration of combat skills'),
    )
    expect(text).toContain(
      'I await your demonstration of combat skills before we can proceed ' +
        'with more serious matters.',
    )
    expect(parseTurn(out).map((b) => b.kind)).toEqual([
      'text',
      'dialogue',
      'dialogue',
    ])
    const again = executeCommands(game, ['talk to sir cedric'])
    expect(again).not.toContain('Wardens')
    expect(again).not.toContain('goes very still')
    expect(again).toContain('I await your demonstration')
  })

  it('keeps the coins handover after the recognition', () => {
    const game = newGame()
    dropAmulet(game)
    executeCommands(game, ['talk to sir cedric'])
    game.state.completedQuests.push(
      new Quest({ name: "The Knight's Test", description: '', completion: '' }),
    )
    executeCommands(game, ['take amulet'])
    const out = executeCommands(game, ['talk to sir cedric'])
    expect(out).toContain('goes very still')
    expect(out).toContain('Please accept these 100 gold coins.')
    expect(game.state.getItemCount('coins')).toBe(100)
  })

  it('keeps the Nature’s Charm handover after the recognition', () => {
    const game = newGame()
    dropAmulet(game)
    executeCommands(game, ['talk to sir cedric'])
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)
    executeCommands(game, ['take amulet'])
    const out = executeCommands(game, ['talk to sir cedric'])
    expect(plain(out)).toContain(STAGE_LINE)
    expect(out).toContain('withdraws an ancient wooden charm')
    expect(game.state.inventory.some((i) => i instanceof NaturesCharm)).toBe(
      true,
    )
  })

  it('names the sigil in examine, bag and room after the recognition', () => {
    const game = newGame()
    expect(executeCommands(game, ['examine amulet'])).toContain(OLD_EXAMINE)
    executeCommands(game, ['talk to sir cedric'])
    expect(executeCommands(game, ['examine amulet'])).toContain(NEW_EXAMINE)
    expect(amuletOf(game).description).toBe(NEW_EXAMINE)
    dropAmulet(game)
    expect(executeCommands(game, ['examine amulet'])).toContain(NEW_EXAMINE)
  })

  it('remembers across save and load, before and after', () => {
    const before = newGame()
    const a = newGame()
    a.loadSaveData(before.toSaveData())
    expect(amuletOf(a).description).toBe(OLD_EXAMINE)
    expect(executeCommands(a, ['talk to sir cedric'])).toContain(
      'Wardens of the Dawn',
    )
    const b = newGame()
    b.loadSaveData(a.toSaveData())
    expect(amuletOf(b).description).toBe(NEW_EXAMINE)
    expect(executeCommands(b, ['talk to sir cedric'])).not.toContain('Wardens')
  })

  it('never recognises in a save without the amulet', () => {
    const game = newGame()
    game.state.inventory = game.state.inventory.filter(
      (i) => !(i instanceof AncientAmulet),
    )
    const loaded = newGame()
    loaded.loadSaveData(game.toSaveData())
    const first = executeCommands(loaded, ['talk to sir cedric'])
    expect(first).toContain(OLD_GREETING)
    expect(executeCommands(loaded, ['talk to sir cedric'])).not.toContain(
      'Wardens',
    )
  })
})
