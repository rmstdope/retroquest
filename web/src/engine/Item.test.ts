import { describe, it, expect } from 'vitest'
import { Item } from './Item'
import { Character } from './Character'
import { GameState } from './GameState'
import { Room } from './Room'

function gameState(): GameState {
  const start = new Room({ name: 'Start', description: '' })
  return new GameState(start, { Start: start }, [])
}

describe('Item', () => {
  it('uses the name as short name unless one is given', () => {
    const plain = new Item({ name: 'Elior', description: 'd' })
    expect(plain.shortName).toBe('Elior')
    expect(plain.canBeCarried).toBe(false)
    const named = new Item({
      name: "Elior's Journal",
      description: 'd',
      shortName: 'journal',
      canBeCarried: true,
    })
    expect(named.shortName).toBe('journal')
    expect(named.canBeCarried).toBe(true)
  })

  it('prevents pickup unless it can be carried', () => {
    expect(new Item({ name: 'well', description: 'd' }).preventPickup()).toBe(
      "[failure]You can't take the [item_name]well[/item_name].[/failure]",
    )
    expect(
      new Item({
        name: 'coin',
        description: 'd',
        canBeCarried: true,
      }).preventPickup(),
    ).toBe('')
  })

  it('answers every action with a failure or nothing by default', () => {
    const gs = gameState()
    const rock = new Item({ name: 'rock', description: 'A grey rock.' })
    const stick = new Item({ name: 'stick', description: 'd' })
    const mira = new Character({ name: 'Mira', description: 'd' })
    expect(rock.use(gs)).toContain("can't use the [item_name]rock[/item_name]")
    expect(rock.useWith(gs, stick)).toContain(
      'with the [item_name]stick[/item_name]',
    )
    expect(rock.useOnCharacter(gs, mira)).toContain(
      'on [character_name]Mira[/character_name]',
    )
    expect(rock.examine(gs)).toBe(
      '[event]You examine the [item_name]rock[/item_name]. A grey rock.[/event]',
    )
    expect(rock.listen(gs)).toContain('is silent')
    expect(rock.pickedUp(gs)).toBe('')
    expect(rock.open(gs)).toContain("can't open")
    expect(rock.close(gs)).toContain("can't close")
    expect(rock.grow(gs)).toContain(
      'does not respond to the [spell_name]grow[/spell_name]',
    )
    expect(rock.eat(gs)).toContain("can't eat")
    expect(rock.drink(gs)).toContain("can't drink")
    expect(rock.equip(gs)).toContain("can't equip")
    expect(rock.unequip(gs)).toContain("can't unequip")
  })
})
