import { describe, it, expect } from 'vitest'
import { Character } from './Character'
import type { NameOptions } from './names'
import { Item } from './Item'
import { GameState } from './GameState'
import { Room } from './Room'
import { Spell } from './Spell'

function gameState(): GameState {
  const start = new Room({ name: 'Start', description: '' })
  return new GameState(start, { Start: start }, [])
}

describe('Character', () => {
  const gs = gameState()
  const mira = new Character({ name: 'Mira', description: 'The wise woman.' })

  it('describes itself when examined', () => {
    expect(mira.examine(gs)).toBe('The wise woman.')
  })

  it('has no special answer to a spell by default', () => {
    const spell = new Spell({ id: 'mend', name: 'mend', description: 'd' })
    expect(mira.receiveSpell(gs, spell)).toBeNull()
  })

  it('has nothing to say by default', () => {
    expect(mira.talkTo(gs)).toBe(
      '[character_name]Mira[/character_name] has nothing to say right now.',
    )
    expect(mira.sayTo(gs, 'hello')).toContain(
      "You say 'hello' to [character_name]Mira",
    )
  })

  it('is not interested in items and sells nothing by default', () => {
    const bread = new Item({ name: 'bread', description: 'd' })
    expect(mira.giveItem(gs, bread)).toContain(
      "doesn't seem interested in the [item_name]bread[/item_name]",
    )
    expect(mira.buyItem(gs, 'rope')).toBe(
      '[character_name]Mira[/character_name] has nothing to sell you.',
    )
    expect(mira.buyItem(gs, 'sword')).toBe(mira.buyItem(gs, 'rope'))
  })

  it('opens a refused gift with the name capitalised word by word', () => {
    const bread = new Item({ name: 'bread', description: 'd' })
    const thorne = new Character({
      name: 'caravan master thorne',
      description: 'd',
    })
    expect(thorne.giveItem(gs, bread)).toMatch(
      /^\[character_name\]Caravan Master Thorne\[\/character_name\] doesn't/,
    )
    const captain = new Character({
      name: 'Captain of the Guard',
      description: 'd',
    })
    expect(captain.giveItem(gs, bread)).toMatch(
      /^\[character_name\]Captain of the Guard\[\/character_name\] doesn't/,
    )
  })

  it('opens a refused sale and the default talk with the name capitalised (rq-05l)', () => {
    const elena = new Character({ name: 'barmaid elena', description: 'd' })
    expect(elena.buyItem(gs, 'ale')).toBe(
      '[character_name]Barmaid Elena[/character_name] has nothing to sell you.',
    )
    expect(elena.talkTo(gs)).toBe(
      '[character_name]Barmaid Elena[/character_name] has nothing to say right now.',
    )
    const captain = new Character({
      name: 'Captain of the Guard',
      description: 'd',
    })
    expect(captain.buyItem(gs, 'rope')).toMatch(
      /^\[character_name\]Captain of the Guard\[\/character_name\] has nothing to sell/,
    )
    expect(captain.talkTo(gs)).toMatch(
      /^\[character_name\]Captain of the Guard\[\/character_name\] has nothing/,
    )
  })
})

describe('Character names in a sentence', () => {
  const gs = gameState()
  const elena = new Character({ name: 'barmaid elena', description: 'd' })

  it('names itself title-cased, at the start and mid-sentence', () => {
    expect(elena.nameInSentence()).toBe(
      '[character_name]Barmaid Elena[/character_name]',
    )
    expect(elena.sayTo(gs, 'hi')).toContain(
      'to [character_name]Barmaid Elena[/character_name], but',
    )
  })

  it('names the item with its article when refusing a gift', () => {
    const token = new Item({ name: "dragon's scale", description: 'd' })
    expect(elena.giveItem(gs, token)).toBe(
      "[character_name]Barmaid Elena[/character_name] doesn't seem interested in " +
        "the [item_name]dragon's scale[/item_name].",
    )
  })
})

/** Characters named by what they are, several of them ("the families"). */
class Families extends Character {
  constructor() {
    super({ name: 'families', description: 'd' })
  }

  /** Named by what they are, so "the families". */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /** Several people, so the verbs are plural. */
  override isPlural(): boolean {
    return true
  }
}

describe('A plural character', () => {
  const gs = gameState()
  const families = new Families()
  const marked = '[character_name]families[/character_name]'

  it('takes plural verbs in the default replies', () => {
    expect(families.talkTo(gs)).toBe(
      `The ${marked} have nothing to say right now.`,
    )
    expect(families.buyItem(gs, 'rope')).toBe(
      `The ${marked} have nothing to sell you.`,
    )
    const bread = new Item({ name: 'bread', description: 'd' })
    expect(families.giveItem(gs, bread)).toBe(
      `The ${marked} don't seem interested in the [item_name]bread[/item_name].`,
    )
  })

  it('is singular unless it says otherwise', () => {
    expect(new Character({ name: 'Mira', description: 'd' }).isPlural()).toBe(
      false,
    )
  })
})
