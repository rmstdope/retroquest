import { describe, it, expect } from 'vitest'
import { Character } from './Character'
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
    expect(mira.buyItem(gs, 'rope')).toContain(
      'does not have any [item_name]rope[/item_name] to sell',
    )
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
})
